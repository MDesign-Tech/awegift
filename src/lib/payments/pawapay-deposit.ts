import "server-only";

import admin from "firebase-admin";

import { adminDb } from "@/lib/firebase/admin";
import { createOrderPaidNotification } from "@/lib/notification/helpers";
import { PAYMENT_METHODS, PAYMENT_STATUSES } from "@/lib/orderStatus";
import {
  isMatchingPawapayAmount,
  pawapayRequest,
} from "@/lib/payments/pawapay";
import type { PawapayConfig } from "@/lib/payments/pawapay";

export type PawapayProvider = {
  provider: "AIRTEL_RWA" | "MTN_MOMO_RWA";
  displayName: "Airtel Money" | "MTN MoMo";
  minimumAmount: number | null;
  maximumAmount: number | null;
  status: string;
};

export type PawapayPhonePrediction = {
  country?: string;
  provider?: string;
  phoneNumber?: string;
};

export type PawapayPaymentState =
  | "paid"
  | "pending"
  | "failed"
  | "duplicate_payment"
  | "verification_required"
  | "not_started";

type ActiveConfiguration = {
  countries?: Array<{
    country?: string;
    providers?: Array<{
      provider?: string;
      displayName?: string;
      currencies?: Array<{
        currency?: string;
        operationTypes?: unknown;
      }>;
    }>;
  }>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function getDepositSettings(operationTypes: unknown) {
  if (Array.isArray(operationTypes)) {
    for (const rawOperation of operationTypes) {
      if (!isRecord(rawOperation)) continue;
      if (rawOperation.operationType === "DEPOSIT") return rawOperation;
      if (isRecord(rawOperation.DEPOSIT)) return rawOperation.DEPOSIT;
    }
    return null;
  }

  if (!isRecord(operationTypes)) return null;
  if (isRecord(operationTypes.DEPOSIT)) return operationTypes.DEPOSIT;
  return operationTypes.operationType === "DEPOSIT" ? operationTypes : null;
}

export async function getRwandaPawapayProviders(config: PawapayConfig) {
  const activeConfiguration = await pawapayRequest<ActiveConfiguration>(
    "/v2/active-conf?country=RWA&operationType=DEPOSIT",
    {},
    config,
  );
  const rwanda = activeConfiguration.countries?.find(
    (country) => country.country === "RWA",
  );
  if (!rwanda || !Array.isArray(rwanda.providers)) {
    return [];
  }

  const supportedProviders = new Map([
    ["AIRTEL_RWA", "Airtel Money"],
    ["MTN_MOMO_RWA", "MTN MoMo"],
  ] as const);

  return rwanda.providers.flatMap((provider) => {
    if (
      typeof provider.provider !== "string" ||
      !supportedProviders.has(provider.provider as PawapayProvider["provider"])
    ) {
      return [];
    }

    const currency = provider.currencies?.find(
      (entry) => entry.currency === "RWF",
    );
    if (!currency) return [];

    const depositSettings = getDepositSettings(currency.operationTypes);
    if (!depositSettings || typeof depositSettings.status !== "string") return [];

    const minimumAmount = Number(
      depositSettings.minAmount ?? depositSettings.minTransactionLimit,
    );
    const maximumAmount = Number(
      depositSettings.maxAmount ?? depositSettings.maxTransactionLimit,
    );
    return [
      {
        provider: provider.provider as PawapayProvider["provider"],
        displayName:
          supportedProviders.get(provider.provider as PawapayProvider["provider"])!,
        minimumAmount: Number.isFinite(minimumAmount) ? minimumAmount : null,
        maximumAmount: Number.isFinite(maximumAmount) ? maximumAmount : null,
        status: depositSettings.status.toUpperCase(),
      },
    ];
  });
}

export function normalizeRwandaPhoneNumber(input: string) {
  const compact = input.trim().replace(/[\s().-]/g, "");
  const international = compact.startsWith("+")
    ? compact.slice(1)
    : compact.startsWith("0")
      ? `250${compact.slice(1)}`
      : compact;
  return /^2507\d{8}$/.test(international) ? international : null;
}

export async function predictRwandaPawapayPhone(
  phoneNumber: string,
  config: PawapayConfig,
) {
  const prediction = await pawapayRequest<PawapayPhonePrediction>(
    "/v2/predict-provider",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber }),
    },
    config,
  );
  const normalizedPhoneNumber =
    typeof prediction.phoneNumber === "string"
      ? normalizeRwandaPhoneNumber(prediction.phoneNumber)
      : null;
  if (
    prediction.country !== "RWA" ||
    (prediction.provider !== "AIRTEL_RWA" &&
      prediction.provider !== "MTN_MOMO_RWA") ||
    !normalizedPhoneNumber
  ) {
    return null;
  }
  return {
    country: prediction.country,
    provider: prediction.provider,
    phoneNumber: normalizedPhoneNumber,
  };
}

export async function getVerifiedPawapayOrderAmount(
  order: Record<string, unknown>,
) {
  const savedAmount = Number(order.totalAmount);
  if (
    !Number.isSafeInteger(savedAmount) ||
    savedAmount <= 0 ||
    (order.currency && order.currency !== "RWF")
  ) {
    return null;
  }

  if (!Array.isArray(order.items) || order.items.length === 0) return null;

  let calculatedAmount = 0;
  for (const rawItem of order.items) {
    if (!isRecord(rawItem)) return null;
    const productId = rawItem.productId;
    const quantity = rawItem.quantity;
    if (
      typeof productId !== "string" ||
      !productId ||
      productId.includes("/") ||
      !Number.isSafeInteger(quantity) ||
      Number(quantity) <= 0
    ) {
      return null;
    }

    const productSnapshot = await adminDb
      .collection("products")
      .doc(productId)
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
    calculatedAmount += price * Number(quantity);
  }

  return Number.isSafeInteger(calculatedAmount) && calculatedAmount === savedAmount
    ? savedAmount
    : null;
}

function stateFromDepositStatus(status: unknown): PawapayPaymentState {
  if (status === "COMPLETED") return "paid";
  if (status === "FAILED" || status === "REJECTED") return "failed";
  return "pending";
}

export async function reconcilePawapayDeposit(
  depositId: string,
  deposit: Record<string, unknown>,
): Promise<PawapayPaymentState> {
  const paymentRef = adminDb.collection("pawapayPayments").doc(depositId);
  const paymentSnapshot = await paymentRef.get();
  if (!paymentSnapshot.exists) {
    console.error("Received a PawaPay deposit for an unknown payment.", depositId);
    return "not_started";
  }

  const attempt = paymentSnapshot.data()!;
  const isCompleted = deposit.status === "COMPLETED";
  const hasAmountOrCurrency =
    deposit.amount !== undefined || deposit.currency !== undefined;
  const amountMatches =
    isCompleted || hasAmountOrCurrency
      ? isMatchingPawapayAmount(
          deposit.amount,
          deposit.currency,
          Number(attempt.amount),
          String(attempt.currency),
        )
      : true;
  if (
    attempt.depositId !== depositId ||
    deposit.depositId !== depositId ||
    !amountMatches ||
    (typeof deposit.country === "string" && deposit.country !== "RWA")
  ) {
    await paymentRef.update({
      status: "verification_required",
      failureReason: "PawaPay deposit details do not match the stored payment.",
      updatedAt: new Date().toISOString(),
    });
    console.error("Rejected a PawaPay deposit with mismatched payment details.", depositId);
    return "verification_required";
  }

  const payer = isRecord(deposit.payer) ? deposit.payer : null;
  const accountDetails =
    payer && isRecord(payer.accountDetails) ? payer.accountDetails : null;
  if (
    accountDetails &&
    ((typeof accountDetails.provider === "string" &&
      accountDetails.provider !== attempt.provider) ||
      (typeof accountDetails.phoneNumber === "string" &&
        accountDetails.phoneNumber !== attempt.phoneNumber))
  ) {
    await paymentRef.update({
      status: "verification_required",
      failureReason: "PawaPay payer details do not match the stored payment.",
      updatedAt: new Date().toISOString(),
    });
    console.error("Rejected a PawaPay deposit with mismatched payer details.", depositId);
    return "verification_required";
  }

  const providerState = stateFromDepositStatus(deposit.status);
  if (
    providerState === "paid" &&
    (payer?.type !== "MMO" ||
      accountDetails?.provider !== attempt.provider ||
      accountDetails?.phoneNumber !== attempt.phoneNumber)
  ) {
    await paymentRef.update({
      status: "verification_required",
      failureReason: "Completed PawaPay deposit has no verified payer details.",
      updatedAt: new Date().toISOString(),
    });
    console.error("Rejected a completed PawaPay deposit without payer details.", depositId);
    return "verification_required";
  }

  const orderId = attempt.orderId;
  if (typeof orderId !== "string") {
    await paymentRef.update({
      status: "verification_required",
      failureReason: "The linked order ID is invalid.",
      updatedAt: new Date().toISOString(),
    });
    return "verification_required";
  }
  const orderRef = adminDb.collection("orders").doc(orderId);
  const result = await adminDb.runTransaction(async (transaction) => {
    const [currentPaymentSnapshot, orderSnapshot] = await Promise.all([
      transaction.get(paymentRef),
      transaction.get(orderRef),
    ]);
    if (!currentPaymentSnapshot.exists) {
      return { state: "not_started" as const, newlyPaid: false };
    }

    const currentPayment = currentPaymentSnapshot.data()!;
    if (!orderSnapshot.exists) {
      transaction.update(paymentRef, {
        status: "verification_required",
        failureReason: "The linked order could not be found.",
        updatedAt: new Date().toISOString(),
      });
      return { state: "verification_required" as const, newlyPaid: false };
    }

    const order = orderSnapshot.data()!;
    if (
      typeof attempt.customerId !== "string" ||
      order.userId !== attempt.customerId
    ) {
      transaction.update(paymentRef, {
        status: "verification_required",
        failureReason: "The linked customer does not match the order.",
        updatedAt: new Date().toISOString(),
      });
      return { state: "verification_required" as const, newlyPaid: false };
    }
    if (
      Number(order.totalAmount) !== Number(attempt.amount) ||
      (order.currency && order.currency !== attempt.currency)
    ) {
      transaction.update(paymentRef, {
        status: "verification_required",
        failureReason: "The linked order total no longer matches the payment.",
        updatedAt: new Date().toISOString(),
      });
      return { state: "verification_required" as const, newlyPaid: false };
    }
    if (currentPayment.status === "paid") {
      return { state: "paid" as const, newlyPaid: false };
    }

    const now = new Date().toISOString();
    const failureReason = isRecord(deposit.failureReason)
      ? deposit.failureReason
      : null;
    if (providerState === "paid") {
      if (String(order.paymentStatus).toLowerCase() === PAYMENT_STATUSES.PAID) {
        transaction.update(paymentRef, {
          status: "duplicate_payment",
          providerTransactionId: deposit.providerTransactionId || null,
          providerStatus: "COMPLETED",
          failureReason: null,
          updatedAt: now,
        });
        return { state: "duplicate_payment" as const, newlyPaid: false };
      }

      const history = Array.isArray(order.paymentHistory) ? order.paymentHistory : [];
      transaction.update(paymentRef, {
        status: "paid",
        providerTransactionId: deposit.providerTransactionId || null,
        providerStatus: "COMPLETED",
        failureReason: null,
        completedAt: now,
        updatedAt: now,
      });
      transaction.update(orderRef, {
        paymentMethod: PAYMENT_METHODS.PAWAPAY,
        paymentStatus: PAYMENT_STATUSES.PAID,
        pawapayDepositId: depositId,
        pawapayPaymentStatus: "COMPLETED",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        paymentHistory: [
          ...history,
          {
            status: PAYMENT_STATUSES.PAID,
            timestamp: now,
            updatedBy: "PawaPay callback/status verification",
            userRole: "system",
            method: PAYMENT_METHODS.PAWAPAY,
            notes: "PawaPay confirmed the mobile money deposit.",
          },
        ],
      });
      return { state: "paid" as const, newlyPaid: true, order };
    }

    const providerStatus =
      typeof deposit.status === "string" ? deposit.status : "UNKNOWN";
    const status = [
      "ACCEPTED",
      "SUBMITTED",
      "PROCESSING",
      "IN_RECONCILIATION",
    ].includes(providerStatus)
      ? providerStatus
      : "PROCESSING";
    transaction.update(paymentRef, {
      status,
      providerStatus,
      failureReason,
      updatedAt: now,
    });
    if (
      providerState === "failed" &&
      order.pawapayDepositId === depositId &&
      String(order.paymentStatus).toLowerCase() !== PAYMENT_STATUSES.PAID
    ) {
      transaction.update(orderRef, {
        pawapayPaymentStatus: status,
        paymentStatus: PAYMENT_STATUSES.FAILED,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    return { state: providerState, newlyPaid: false };
  });

  if (result.newlyPaid && result.order) {
    try {
      await createOrderPaidNotification(
        attempt.customerId,
        result.order.customerEmail,
        result.order.customerName,
        orderId,
        Number(attempt.amount),
        String(attempt.currency),
      );
    } catch (error) {
      console.error("PawaPay order-paid notification could not be sent.", error);
    }
  }

  return result.state;
}
