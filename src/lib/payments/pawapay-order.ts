import "server-only";

import admin from "firebase-admin";

import { adminDb } from "@/lib/firebase/admin";
import { createOrderPaidNotification } from "@/lib/notification/helpers";
import { PAYMENT_METHODS, PAYMENT_STATUSES } from "@/lib/orderStatus";
import { isMatchingPawapayAmount } from "@/lib/payments/pawapay";

export type PawapayCheckoutData = Record<string, unknown>;

export type PawapayOrderPaymentState =
  | "paid"
  | "pending"
  | "failed"
  | "cancelled"
  | "expired"
  | "duplicate_payment"
  | "verification_required"
  | "not_started";

function getCompletedDeposit(checkout: PawapayCheckoutData) {
  const directDeposit = checkout.deposit;
  if (
    directDeposit &&
    typeof directDeposit === "object" &&
    !Array.isArray(directDeposit)
  ) {
    return directDeposit as Record<string, unknown>;
  }

  if (Array.isArray(checkout.depositsHistory)) {
    const completedDeposit = checkout.depositsHistory.find(
      (deposit) =>
        deposit &&
        typeof deposit === "object" &&
        (deposit as Record<string, unknown>).status === "COMPLETED",
    );
    if (completedDeposit && typeof completedDeposit === "object") {
      return completedDeposit as Record<string, unknown>;
    }
  }
  return null;
}

function stateFromProviderStatus(status: unknown): PawapayOrderPaymentState {
  switch (status) {
    case "COMPLETED":
      return "paid";
    case "FAILED":
      return "failed";
    case "CANCELLED":
      return "cancelled";
    case "EXPIRED":
      return "expired";
    case "WAITING_PAYMENT":
    case "ACCEPTED":
      return "pending";
    default:
      return "pending";
  }
}

export async function reconcilePawapayCheckout(
  checkoutId: string,
  checkout: PawapayCheckoutData,
): Promise<PawapayOrderPaymentState> {
  const paymentRef = adminDb.collection("pawapayPayments").doc(checkoutId);
  const paymentSnapshot = await paymentRef.get();
  if (!paymentSnapshot.exists) {
    console.error("Received a PawaPay checkout callback for an unknown checkout.", checkoutId);
    return "not_started";
  }

  const attempt = paymentSnapshot.data()!;
  const orderId = attempt.orderId;
  if (
    attempt.checkoutId !== checkoutId ||
    typeof orderId !== "string" ||
    checkout.checkoutId !== checkoutId ||
    checkout.clientReferenceId !== orderId
  ) {
    console.error("Rejected a PawaPay checkout with mismatched references.", checkoutId);
    return "verification_required";
  }

  const providerState = stateFromProviderStatus(checkout.status);
  const completedDeposit = providerState === "paid" ? getCompletedDeposit(checkout) : null;
  if (
    providerState === "paid" &&
    (!completedDeposit ||
      completedDeposit.status !== "COMPLETED" ||
      !isMatchingPawapayAmount(
        completedDeposit.amount,
        completedDeposit.currency,
        Number(attempt.amount),
        String(attempt.currency),
      ))
  ) {
    console.error("Rejected a PawaPay checkout with mismatched payment details.", checkoutId);
    await paymentRef.update({
      status: "verification_required",
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
    if (!currentPaymentSnapshot.exists || !orderSnapshot.exists) {
      return { state: "not_started" as const, newlyPaid: false };
    }

    const currentPayment = currentPaymentSnapshot.data()!;
    const order = orderSnapshot.data()!;
    if (currentPayment.status === "COMPLETED" || currentPayment.status === "paid") {
      return { state: "paid" as const, newlyPaid: false };
    }

    const now = new Date().toISOString();
    if (providerState === "paid") {
      if (String(order.paymentStatus).toLowerCase() === PAYMENT_STATUSES.PAID) {
        transaction.update(paymentRef, {
          status: "duplicate_payment",
          depositId: completedDeposit?.depositId || null,
          updatedAt: now,
        });
        return { state: "duplicate_payment" as const, newlyPaid: false };
      }

      const history = Array.isArray(order.paymentHistory) ? order.paymentHistory : [];
      transaction.update(paymentRef, {
        status: "paid",
        depositId: completedDeposit?.depositId || null,
        providerTransactionId: completedDeposit?.providerTransactionId || null,
        completedAt: now,
        updatedAt: now,
      });
      transaction.update(orderRef, {
        paymentMethod: PAYMENT_METHODS.PAWAPAY,
        paymentStatus: PAYMENT_STATUSES.PAID,
        pawapayCheckoutId: checkoutId,
        pawapayPaymentStatus: "COMPLETED",
        ...(typeof completedDeposit?.depositId === "string"
          ? { pawapayDepositId: completedDeposit.depositId }
          : {}),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        paymentHistory: [
          ...history,
          {
            status: PAYMENT_STATUSES.PAID,
            timestamp: now,
            updatedBy: "PawaPay callback verification",
            userRole: "system",
            method: PAYMENT_METHODS.PAWAPAY,
            notes: "PawaPay confirmed the hosted checkout payment.",
          },
        ],
      });
      return { state: "paid" as const, newlyPaid: true, order };
    }

    const finalState = ["failed", "cancelled", "expired"].includes(providerState);
    transaction.update(paymentRef, {
      status: finalState ? providerState.toUpperCase() : String(checkout.status),
      updatedAt: now,
    });
    if (finalState && order.pawapayCheckoutId === checkoutId) {
      transaction.update(orderRef, {
        pawapayPaymentStatus: providerState.toUpperCase(),
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
