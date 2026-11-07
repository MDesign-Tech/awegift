"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { FiAlertCircle, FiCheckCircle, FiLoader, FiRefreshCw } from "react-icons/fi";

type PaymentState =
  | "checking"
  | "paid"
  | "pending"
  | "failed"
  | "cancelled"
  | "expired"
  | "duplicate_payment"
  | "verification_required"
  | "not_started"
  | "unauthorized"
  | "unknown"
  | "error";

export default function PawapayPaymentResultClient({
  orderId,
  depositId,
}: {
  orderId?: string;
  depositId?: string;
}) {
  const [status, setStatus] = useState<PaymentState>("checking");
  const [refreshing, setRefreshing] = useState(false);

  const refreshStatus = useCallback(async () => {
    if (!depositId && !orderId) {
      setStatus("error");
      return;
    }

    setRefreshing(true);
    try {
      const url = depositId
        ? `/api/payments/pawapay/status/${encodeURIComponent(depositId)}`
        : `/api/payments/pawapay/status?orderId=${encodeURIComponent(orderId!)}`;
      const response = await fetch(url, { cache: "no-store" });
      if (response.status === 401) {
        setStatus("unauthorized");
        return;
      }

      const data = await response.json();
      const result = data.state || data.status;
      const validStates: PaymentState[] = [
        "paid",
        "pending",
        "failed",
        "cancelled",
        "expired",
        "duplicate_payment",
        "verification_required",
        "not_started",
      ];
      setStatus(validStates.includes(result) ? result : "unknown");
    } catch {
      setStatus("error");
    } finally {
      setRefreshing(false);
    }
  }, [depositId, orderId]);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    if (
      status !== "pending" &&
      status !== "checking" &&
      status !== "verification_required" &&
      status !== "error"
    ) {
      return;
    }
    const timer = setInterval(() => {
      if (!refreshing) void refreshStatus();
    }, 5000);
    return () => clearInterval(timer);
  }, [refreshStatus, refreshing, status]);

  const isPending =
    status === "checking" ||
    status === "pending" ||
    status === "verification_required" ||
    status === "unknown";
  const isFailure =
    status === "failed" || status === "cancelled" || status === "expired";

  const heading =
    status === "paid"
      ? "Payment confirmed"
      : status === "failed"
        ? "Payment unsuccessful"
        : status === "cancelled"
          ? "Payment cancelled"
          : status === "expired"
            ? "Payment expired"
            : status === "duplicate_payment"
              ? "Payment needs assistance"
              : status === "unauthorized"
                ? "Sign in to check your payment"
                : status === "not_started"
                  ? "No PawaPay checkout found"
                  : status === "unknown"
                    ? "Payment status is being checked"
                  : "Payment status pending";

  const message =
    status === "paid"
      ? "PawaPay confirmed the payment directly with the payment provider."
      : status === "failed"
        ? "PawaPay did not approve this payment. You can try again."
        : status === "cancelled"
          ? "The checkout was cancelled. Return to checkout to try again."
          : status === "expired"
            ? "The checkout expired before payment was completed. Please start a new checkout."
            : status === "duplicate_payment"
              ? "A payment was received for an order that is already paid. Contact support before trying again."
              : status === "unauthorized"
                ? "Sign in with the account that placed this order to view its payment status."
                : status === "not_started"
                  ? "We could not find a PawaPay checkout for this order."
                  : status === "unknown"
                    ? "PawaPay returned a status we do not recognize. We will not mark the order paid or failed until the status is verified."
                  : status === "error"
                    ? "We could not retrieve a verified payment status. Your order has not been marked paid."
                    : status === "pending"
                      ? "Approve the payment request on your phone. We are waiting for PawaPay to confirm the transaction."
                      : "We are checking the status directly with PawaPay. This page does not treat the browser redirect as proof of payment.";

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl items-center px-4 py-12">
      <section className="w-full rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm sm:p-10">
        {status === "paid" ? (
          <FiCheckCircle className="mx-auto h-12 w-12 text-green-600" aria-hidden="true" />
        ) : isPending || refreshing ? (
          <FiLoader className="mx-auto h-12 w-12 animate-spin text-theme-color" aria-hidden="true" />
        ) : (
          <FiAlertCircle className="mx-auto h-12 w-12 text-orange-600" aria-hidden="true" />
        )}
        <h1 className="mt-4 text-2xl font-bold text-gray-900">{heading}</h1>
        {orderId && <p className="mt-2 text-sm text-gray-500">Order #{orderId}</p>}
        {depositId && (
          <p className="mt-1 break-all text-xs text-gray-500">
            Payment reference: {depositId}
          </p>
        )}
        <p className="mx-auto mt-4 max-w-xl text-gray-700">{message}</p>

        {(isPending || status === "error") && (depositId || orderId) && (
          <button
            type="button"
            onClick={() => void refreshStatus()}
            disabled={refreshing}
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-theme-color px-5 py-3 font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            <FiRefreshCw className={`mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh payment status
          </button>
        )}

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          {orderId && status === "unauthorized" && (
            <Link
              href={`/auth/signin?callbackUrl=${encodeURIComponent(`/payment/result?orderId=${orderId}${depositId ? `&depositId=${depositId}` : ""}`)}`}
              className="rounded-lg border border-gray-300 px-5 py-3 font-medium text-gray-800 hover:bg-gray-50"
            >
              Sign in
            </Link>
          )}
          {orderId && (
            <Link
              href={`/account/orders/${encodeURIComponent(orderId)}`}
              className="rounded-lg border border-gray-300 px-5 py-3 font-medium text-gray-800 hover:bg-gray-50"
            >
              View order
            </Link>
          )}
          {orderId && isFailure && (
            <Link
              href={`/checkout?orderId=${encodeURIComponent(orderId)}`}
              className="rounded-lg bg-theme-color px-5 py-3 font-medium text-white hover:opacity-90"
            >
              Try payment again
            </Link>
          )}
          <Link
            href="/account/orders"
            className="rounded-lg border border-gray-300 px-5 py-3 font-medium text-gray-800 hover:bg-gray-50"
          >
            My orders
          </Link>
        </div>
      </section>
    </main>
  );
}
