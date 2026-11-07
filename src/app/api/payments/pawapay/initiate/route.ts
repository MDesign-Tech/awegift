import crypto from "node:crypto";
import admin from "firebase-admin";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { adminDb } from "@/lib/firebase/admin";
import { PAYMENT_METHODS, PAYMENT_STATUSES } from "@/lib/orderStatus";
import {
  getPawapayConfig,
  PawapayError,
  pawapayRequest,
} from "@/lib/payments/pawapay";
import {
  getRwandaPawapayProviders,
  getVerifiedPawapayOrderAmount,
  normalizeRwandaPhoneNumber,
  predictRwandaPawapayPhone,
  reconcilePawapayDeposit,
} from "@/lib/payments/pawapay-deposit";
import type {
  PawapayPaymentState,
  PawapayProvider,
} from "@/lib/payments/pawapay-deposit";

export const runtime = "nodejs";

type DepositResponse = {
  depositId?: string;
  status?: string;
  failureReason?: {
    failureCode?: string;
    failureMessage?: string;
  };
};

type DepositStatusResponse = {
  status?: string;
  data?: Record<string, unknown>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function pendingState(status: unknown) {
  return status === "FAILED" || status === "REJECTED" ? "failed" : "pending";
}

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 16_000) {
    return NextResponse.json({ error: "Payment request is too large." }, { status: 413 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let requestData: unknown;
  try {
    requestData = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid payment details." }, { status: 400 });
  }

  if (!isRecord(requestData)) {
    return NextResponse.json({ error: "Invalid payment details." }, { status: 400 });
  }
  const { orderId, provider } = requestData;
  if (
    typeof orderId !== "string" ||
    !orderId.trim() ||
    orderId.length > 128 ||
    orderId.includes("/") ||
    (provider !== "AIRTEL_RWA" && provider !== "MTN_MOMO_RWA") ||
    typeof requestData.phoneNumber !== "string" ||
    requestData.phoneNumber.length > 32
  ) {
    return NextResponse.json(
      { error: "A valid order, provider, and Rwanda phone number are required." },
      { status: 400 },
    );
  }

  let phoneNumber = normalizeRwandaPhoneNumber(requestData.phoneNumber);
  if (!phoneNumber) {
    return NextResponse.json(
      { error: "Enter a valid Rwanda mobile number, such as 0781234567." },
      { status: 400 },
    );
  }

  let config: ReturnType<typeof getPawapayConfig>;
  let providers: PawapayProvider[];
  try {
    config = getPawapayConfig();
    providers = await getRwandaPawapayProviders(config);
  } catch (error) {
    console.error(
      "PawaPay payment configuration or provider discovery failed.",
      error instanceof PawapayError
        ? { code: error.code, httpStatus: error.httpStatus }
        : "unexpected",
    );
    return NextResponse.json(
      { error: "Mobile money payments are temporarily unavailable." },
      { status: 503 },
    );
  }

  const selectedProvider = providers.find(
    (option) => option.provider === provider,
  );
  if (
    !selectedProvider ||
    !["OPERATIONAL", "DELAYED"].includes(selectedProvider.status)
  ) {
    return NextResponse.json(
      { error: "The selected mobile money provider is not currently available." },
      { status: 409 },
    );
  }

  const orderRef = adminDb.collection("orders").doc(orderId);
  const orderSnapshot = await orderRef.get();
  if (!orderSnapshot.exists) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const order = orderSnapshot.data()!;
  if (order.userId !== session.user.id) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }
  if (String(order.paymentStatus).toLowerCase() === PAYMENT_STATUSES.PAID) {
    return NextResponse.json({ error: "This order has already been paid." }, { status: 409 });
  }
  if (String(order.status).toLowerCase() === "cancelled") {
    return NextResponse.json({ error: "Cancelled orders cannot be paid." }, { status: 409 });
  }

  const amount = await getVerifiedPawapayOrderAmount(order);
  if (amount === null) {
    return NextResponse.json(
      { error: "The order total could not be verified as a whole RWF amount." },
      { status: 409 },
    );
  }
  if (
    (selectedProvider.minimumAmount !== null &&
      amount < selectedProvider.minimumAmount) ||
    (selectedProvider.maximumAmount !== null &&
      amount > selectedProvider.maximumAmount)
  ) {
    return NextResponse.json(
      { error: "The order total is outside this provider's payment limits." },
      { status: 409 },
    );
  }

  try {
    const prediction = await predictRwandaPawapayPhone(phoneNumber, config);
    if (!prediction) {
      return NextResponse.json(
        { error: "The phone number could not be verified as a Rwanda mobile number." },
        { status: 400 },
      );
    }
    phoneNumber = prediction.phoneNumber;
  } catch (error) {
    if (
      error instanceof PawapayError &&
      error.code === "http" &&
      error.httpStatus === 400
    ) {
      return NextResponse.json(
        { error: "Enter a valid Rwanda mobile money phone number." },
        { status: 400 },
      );
    }
    console.error(
      "PawaPay phone validation is unavailable.",
      error instanceof PawapayError
        ? { code: error.code, httpStatus: error.httpStatus }
        : "unexpected",
    );
    return NextResponse.json(
      { error: "Phone number validation is temporarily unavailable." },
      { status: 503 },
    );
  }

  const newDepositId = crypto.randomUUID();
  const newPaymentRef = adminDb.collection("pawapayPayments").doc(newDepositId);
  const reservation = await adminDb.runTransaction(async (transaction) => {
    const currentOrderSnapshot = await transaction.get(orderRef);
    if (!currentOrderSnapshot.exists) return { error: "not_found" as const };

    const currentOrder = currentOrderSnapshot.data()!;
    if (currentOrder.userId !== session.user.id) return { error: "forbidden" as const };
    if (String(currentOrder.paymentStatus).toLowerCase() === PAYMENT_STATUSES.PAID) {
      return { error: "paid" as const };
    }
    if (
      Number(currentOrder.totalAmount) !== amount ||
      (currentOrder.currency && currentOrder.currency !== "RWF")
    ) {
      return { error: "price_changed" as const };
    }

    const existingDepositId = currentOrder.pawapayDepositId;
    if (typeof existingDepositId === "string") {
      const existingPaymentRef = adminDb
        .collection("pawapayPayments")
        .doc(existingDepositId);
      const existingPaymentSnapshot = await transaction.get(existingPaymentRef);
      if (existingPaymentSnapshot.exists) {
        const existingPayment = existingPaymentSnapshot.data()!;
        const isTerminal = ["FAILED", "REJECTED"].includes(
          String(existingPayment.status),
        );
        if (!isTerminal) {
          if (
            existingPayment.provider !== provider ||
            existingPayment.phoneNumber !== phoneNumber ||
            Number(existingPayment.amount) !== amount ||
            existingPayment.currency !== "RWF"
          ) {
            return { error: "payment_in_progress" as const };
          }
          return {
            existing: true as const,
            depositId: existingDepositId,
            status: String(existingPayment.status || "INITIATING"),
            shouldSubmit: existingPayment.status === "INITIATING",
          };
        }
      }
    }

    if (
      typeof currentOrder.pawapayCheckoutId === "string" &&
      !["FAILED", "CANCELLED", "EXPIRED"].includes(
        String(currentOrder.pawapayPaymentStatus),
      )
    ) {
      return { error: "payment_in_progress" as const };
    }

    const now = new Date().toISOString();
    transaction.create(newPaymentRef, {
      depositId: newDepositId,
      orderId,
      customerId: session.user.id,
      amount,
      currency: "RWF",
      phoneNumber,
      correspondent: provider,
      provider,
      status: "INITIATING",
      failureReason: null,
      createdAt: now,
      updatedAt: now,
    });
    transaction.update(orderRef, {
      paymentMethod: PAYMENT_METHODS.PAWAPAY,
      paymentStatus: PAYMENT_STATUSES.PENDING,
      pawapayDepositId: newDepositId,
      pawapayPaymentStatus: "INITIATING",
      pricingVerified: true,
      currency: "RWF",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { depositId: newDepositId, status: "INITIATING", shouldSubmit: true };
  });

  if ("error" in reservation) {
    if (reservation.error === "not_found") {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    if (reservation.error === "forbidden") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }
    if (reservation.error === "payment_in_progress") {
      return NextResponse.json(
        { error: "A payment for this order is already being processed." },
        { status: 409 },
      );
    }
    if (reservation.error === "price_changed") {
      return NextResponse.json(
        { error: "The order total changed. Refresh checkout before paying." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "This order has already been paid." }, { status: 409 });
  }

  const { depositId } = reservation;
  const paymentRef = adminDb.collection("pawapayPayments").doc(depositId);
  if (!reservation.shouldSubmit) {
    return NextResponse.json({
      depositId,
      state: pendingState(reservation.status),
      status: reservation.status,
      duplicateRequest: true,
    });
  }

  try {
    const response = await pawapayRequest<DepositResponse>(
      "/v2/deposits",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          depositId,
          amount: String(amount),
          currency: "RWF",
          payer: {
            type: "MMO",
            accountDetails: {
              phoneNumber,
              provider,
            },
          },
        }),
      },
      config,
    );

    if (
      (response.depositId && response.depositId !== depositId) ||
      (response.status !== "REJECTED" && response.depositId !== depositId)
    ) {
      throw new PawapayError(
        "PawaPay returned a different deposit ID.",
        "invalid_response",
      );
    }
    if (typeof response.status !== "string") {
      throw new PawapayError(
        "PawaPay returned an invalid deposit response.",
        "invalid_response",
      );
    }

    if (response.status === "DUPLICATE_IGNORED") {
      const existingStatus = await pawapayRequest<DepositStatusResponse>(
        `/v2/deposits/${encodeURIComponent(depositId)}`,
        {},
        config,
      );
      if (
        existingStatus.status === "FOUND" &&
        existingStatus.data?.depositId === depositId
      ) {
        const state = await reconcilePawapayDeposit(depositId, existingStatus.data);
        return NextResponse.json({ depositId, status: existingStatus.data.status, state });
      }
    }

    const isRejected = response.status === "REJECTED";
    const knownInitiationStatus = [
      "ACCEPTED",
      "DUPLICATE_IGNORED",
      "REJECTED",
    ].includes(response.status);
    await adminDb.runTransaction(async (transaction) => {
      const [currentPaymentSnapshot, currentOrderSnapshot] = await Promise.all([
        transaction.get(paymentRef),
        transaction.get(orderRef),
      ]);
      if (!currentPaymentSnapshot.exists || !currentOrderSnapshot.exists) return;

      const currentPayment = currentPaymentSnapshot.data()!;
      const currentOrder = currentOrderSnapshot.data()!;
      if (
        ["paid", "duplicate_payment", "COMPLETED", "FAILED", "REJECTED"].includes(
          String(currentPayment.status),
        )
      ) {
        return;
      }

      const now = new Date().toISOString();
      transaction.update(paymentRef, {
        status: knownInitiationStatus ? response.status : "INITIATING",
        providerStatus: response.status,
        failureReason: response.failureReason || null,
        updatedAt: now,
      });
      if (
        currentOrder.pawapayDepositId === depositId &&
        String(currentOrder.paymentStatus).toLowerCase() !== PAYMENT_STATUSES.PAID
      ) {
        transaction.update(orderRef, {
          ...(isRejected
            ? {
                pawapayPaymentStatus: "REJECTED",
                paymentStatus: PAYMENT_STATUSES.FAILED,
              }
            : { pawapayPaymentStatus: response.status }),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    });

    return NextResponse.json({
      depositId,
      status: response.status,
      state: isRejected ? ("failed" satisfies PawapayPaymentState) : "pending",
      failureReason: response.failureReason?.failureMessage,
    });
  } catch (error) {
    console.error(
      "PawaPay deposit initiation could not be confirmed.",
      error instanceof PawapayError
        ? { code: error.code, httpStatus: error.httpStatus }
        : "unexpected",
    );
    await adminDb.runTransaction(async (transaction) => {
      const currentPaymentSnapshot = await transaction.get(paymentRef);
      if (
        currentPaymentSnapshot.exists &&
        currentPaymentSnapshot.data()?.status === "INITIATING"
      ) {
        transaction.update(paymentRef, {
          failureReason:
            "Provider response not confirmed; status reconciliation required.",
          updatedAt: new Date().toISOString(),
        });
      }
    });
    return NextResponse.json(
      {
        depositId,
        state: "pending",
        status: "INITIATING",
        message: "We could not confirm the request yet. Check the payment status before retrying.",
      },
      { status: 202 },
    );
  }
}
