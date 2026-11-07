import crypto from "node:crypto";
import admin from "firebase-admin";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { adminDb } from "@/lib/firebase/admin";
import { PAYMENT_METHODS, PAYMENT_STATUSES } from "@/lib/orderStatus";
import {
  getPawapayConfig,
  getPawapaySiteOrigin,
  PawapayError,
  pawapayRequest,
  validatePawapayRedirectUrl,
} from "@/lib/payments/pawapay";

export const runtime = "nodejs";

type OrderItem = {
  productId?: unknown;
  quantity?: unknown;
};

type CheckoutResponse = {
  checkoutId?: string;
  status?: string;
  redirectUrl?: string;
  checkoutCode?: string;
  expiresAt?: string;
  failureReason?: {
    failureCode?: string;
    failureMessage?: string;
  };
};

async function getVerifiedOrderAmount(
  order: Record<string, unknown>,
): Promise<number | null> {
  const savedAmount = Number(order.totalAmount);
  if (!Number.isFinite(savedAmount) || savedAmount <= 0) return null;

  if (!Array.isArray(order.items) || order.items.length === 0) return null;

  let calculatedAmount = 0;
  for (const rawItem of order.items as OrderItem[]) {
    if (
      typeof rawItem.productId !== "string" ||
      !Number.isSafeInteger(rawItem.quantity) ||
      Number(rawItem.quantity) <= 0
    ) {
      return null;
    }

    const productSnapshot = await adminDb
      .collection("products")
      .doc(rawItem.productId)
      .get();
    if (!productSnapshot.exists) return null;

    const product = productSnapshot.data()!;
    const price = Number(product.price);
    if (
      product.isActive === false ||
      !Number.isFinite(price) ||
      price < 0 ||
      (product.currency && product.currency !== "RWF")
    ) {
      return null;
    }
    calculatedAmount += price * Number(rawItem.quantity);
  }

  return Math.round(calculatedAmount * 100) === Math.round(savedAmount * 100)
    ? savedAmount
    : null;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let requestData: unknown;
  try {
    requestData = await request.json();
  } catch {
    return NextResponse.json({ error: "A valid order ID is required." }, { status: 400 });
  }

  const orderId =
    requestData && typeof requestData === "object"
      ? (requestData as Record<string, unknown>).orderId
      : undefined;
  if (typeof orderId !== "string" || !orderId.trim() || orderId.length > 128) {
    return NextResponse.json({ error: "A valid order ID is required." }, { status: 400 });
  }

  let config;
  let siteOrigin: string;
  try {
    config = getPawapayConfig();
    siteOrigin = getPawapaySiteOrigin();
  } catch (error) {
    console.error(
      "PawaPay payment configuration is invalid.",
      error instanceof PawapayError ? error.code : "unexpected",
    );
    return NextResponse.json(
      { error: "PawaPay payments are not configured." },
      { status: 503 },
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
  if (order.currency && order.currency !== "RWF") {
    return NextResponse.json({ error: "PawaPay is not configured for this order currency." }, { status: 409 });
  }

  const amount = await getVerifiedOrderAmount(order);
  if (amount === null) {
    return NextResponse.json(
      { error: "The order total could not be verified. Please place the order again." },
      { status: 409 },
    );
  }

  const newCheckoutId = crypto.randomUUID();
  const newPaymentRef = adminDb.collection("pawapayPayments").doc(newCheckoutId);
  const now = new Date();
  const reservation = await adminDb.runTransaction(async (transaction) => {
    const currentOrderSnapshot = await transaction.get(orderRef);
    if (!currentOrderSnapshot.exists) return { error: "not_found" as const };

    const currentOrder = currentOrderSnapshot.data()!;
    if (currentOrder.userId !== session.user.id) return { error: "forbidden" as const };
    if (String(currentOrder.paymentStatus).toLowerCase() === PAYMENT_STATUSES.PAID) {
      return { error: "paid" as const };
    }

    const existingId = currentOrder.pawapayCheckoutId;
    let existingAttempt:
      | FirebaseFirestore.DocumentData
      | undefined;
    let existingPaymentRef:
      | FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>
      | undefined;
    if (typeof existingId === "string") {
      existingPaymentRef = adminDb.collection("pawapayPayments").doc(existingId);
      const existingSnapshot = await transaction.get(existingPaymentRef);
      if (existingSnapshot.exists) existingAttempt = existingSnapshot.data();
    }

    const isActive =
      existingAttempt &&
      ["initiating", "WAITING_PAYMENT", "ACCEPTED"].includes(
        String(existingAttempt.status),
      );
    if (existingAttempt && isActive && existingAttempt.redirectUrl) {
      return {
        existing: true as const,
        checkoutId: String(existingAttempt.checkoutId),
        redirectUrl: String(existingAttempt.redirectUrl),
      };
    }

    if (existingAttempt && isActive && existingAttempt.checkoutId) {
      return {
        existing: true as const,
        checkoutId: String(existingAttempt.checkoutId),
      };
    }

    transaction.create(newPaymentRef, {
      checkoutId: newCheckoutId,
      orderId,
      customerId: session.user.id,
      amount,
      currency: "RWF",
      status: "initiating",
      createdAt: now.toISOString(),
    });
    transaction.update(orderRef, {
      paymentMethod: PAYMENT_METHODS.PAWAPAY,
      paymentStatus: PAYMENT_STATUSES.PENDING,
      pawapayCheckoutId: newCheckoutId,
      pawapayPaymentStatus: "initiating",
      pricingVerified: true,
      currency: "RWF",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { checkoutId: newCheckoutId };
  });

  if ("error" in reservation) {
    if (reservation.error === "not_found") {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    if (reservation.error === "forbidden") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }
    return NextResponse.json({ error: "This order has already been paid." }, { status: 409 });
  }
  if (reservation.redirectUrl) {
    return NextResponse.json({ checkoutUrl: reservation.redirectUrl });
  }

  const checkoutId = reservation.checkoutId;
  const paymentRef = adminDb.collection("pawapayPayments").doc(checkoutId);
  try {
    const response = await pawapayRequest<CheckoutResponse>(
      "/v2/checkouts",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkoutId,
          returnUrl: `${siteOrigin}/payment/result?orderId=${encodeURIComponent(orderId)}`,
          returnMethod: "INSTANT",
          defaultLanguage: "en",
          countries: ["RWA"],
          expiresAfter: 30,
          amounts: [{ country: "RWA", currency: "RWF", amount: String(amount) }],
          clientReferenceId: orderId,
          reason: { en: "AweGift Order" },
          metadata: [{ orderId }],
        }),
      },
      config,
    );

    if (
      response.checkoutId !== checkoutId ||
      (response.status !== "ACCEPTED" && response.status !== "DUPLICATE_IGNORED")
    ) {
      const message =
        response.failureReason?.failureMessage ||
        "PawaPay rejected the checkout request.";
      await paymentRef.update({ status: "FAILED", failureMessage: message });
      await orderRef.update({
        pawapayPaymentStatus: "FAILED",
        paymentStatus: PAYMENT_STATUSES.FAILED,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return NextResponse.json({ error: message }, { status: 502 });
    }

    let redirectUrl = response.redirectUrl;
    if (response.status === "DUPLICATE_IGNORED" || !redirectUrl) {
      const existingCheckout = await pawapayRequest<{
        status?: string;
        data?: { redirectUrl?: string };
      }>(`/v2/checkouts/${encodeURIComponent(checkoutId)}`, {}, config);
      if (existingCheckout.status !== "FOUND") {
        throw new PawapayError(
          "PawaPay has not made the checkout available yet.",
          "invalid_response",
        );
      }
      redirectUrl = existingCheckout.data?.redirectUrl;
    }

    if (typeof redirectUrl !== "string") {
      throw new PawapayError("PawaPay did not return a checkout URL.", "invalid_response");
    }
    const safeRedirectUrl = validatePawapayRedirectUrl(
      redirectUrl,
      config.environment,
    );

    await paymentRef.update({
      status: "WAITING_PAYMENT",
      redirectUrl: safeRedirectUrl,
      checkoutCode: response.checkoutCode || null,
      expiresAt: response.expiresAt || null,
      updatedAt: new Date().toISOString(),
    });
    await orderRef.update({
      pawapayPaymentStatus: "WAITING_PAYMENT",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ checkoutUrl: safeRedirectUrl });
  } catch (error) {
    console.error(
      "PawaPay checkout initiation failed.",
      error instanceof PawapayError ? error.code : "unexpected",
    );
    return NextResponse.json(
      {
        error:
          error instanceof PawapayError && error.code === "configuration"
            ? "PawaPay payments are not configured."
            : "Unable to start PawaPay checkout. Please try again.",
      },
      { status: error instanceof PawapayError && error.code === "configuration" ? 503 : 502 },
    );
  }
}
