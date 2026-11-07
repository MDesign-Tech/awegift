import admin from "firebase-admin";
import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { adminDb } from "@/lib/firebase/admin";
import {
  getPawapayConfig,
  PawapayError,
  pawapayRequest,
} from "@/lib/payments/pawapay";
import { reconcilePawapayDeposit } from "@/lib/payments/pawapay-deposit";

export const runtime = "nodejs";

const pendingStatuses = [
  "INITIATING",
  "ACCEPTED",
  "SUBMITTED",
  "PROCESSING",
  "IN_RECONCILIATION",
  "DUPLICATE_IGNORED",
];

type DepositStatusResponse = {
  status?: string;
  data?: Record<string, unknown>;
};

function isAuthorized(request: NextRequest) {
  const expectedToken = process.env.PAWAPAY_RECONCILIATION_SECRET;
  const authorization = request.headers.get("authorization") || "";
  const suppliedToken = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";
  if (!expectedToken || !suppliedToken) return false;

  const expected = Buffer.from(expectedToken);
  const supplied = Buffer.from(suppliedToken);
  return (
    expected.length === supplied.length &&
    timingSafeEqual(expected, supplied)
  );
}

export async function POST(request: NextRequest) {
  if (!process.env.PAWAPAY_RECONCILIATION_SECRET) {
    return NextResponse.json(
      { error: "Payment reconciliation is not configured." },
      { status: 503 },
    );
  }
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const config = getPawapayConfig();
    const cursorRef = adminDb
      .collection("pawapaySystem")
      .doc("reconciliation");
    const cursorSnapshot = await cursorRef.get();
    const lastProcessedId = cursorSnapshot.data()?.lastProcessedId;
    let pendingQuery = adminDb
      .collection("pawapayPayments")
      .where("status", "in", pendingStatuses)
      .orderBy(admin.firestore.FieldPath.documentId())
      .limit(10);
    if (typeof lastProcessedId === "string") {
      pendingQuery = pendingQuery.startAfter(lastProcessedId);
    }
    const pendingPayments = await pendingQuery.get();
    if (pendingPayments.empty && typeof lastProcessedId === "string") {
      await cursorRef.set({
        lastProcessedId: null,
        updatedAt: new Date().toISOString(),
      });
      return NextResponse.json({ checked: 0, failedChecks: 0, results: [] });
    }

    await cursorRef.set({
      lastProcessedId:
        pendingPayments.size === 10
          ? pendingPayments.docs[pendingPayments.size - 1].id
          : null,
      updatedAt: new Date().toISOString(),
    });

    const outcomes = await Promise.allSettled(
      pendingPayments.docs.map(async (paymentDoc) => {
        const depositId = paymentDoc.id;
        const payment = paymentDoc.data();
        const result = await pawapayRequest<DepositStatusResponse>(
          `/v2/deposits/${encodeURIComponent(depositId)}`,
          {},
          config,
        );
        if (
          result.status === "FOUND" &&
          result.data &&
          result.data.depositId === depositId
        ) {
          return reconcilePawapayDeposit(depositId, result.data);
        }

        if (
          payment.status !== "INITIATING" &&
          payment.status !== "DUPLICATE_IGNORED"
        ) {
          return "pending";
        }
        if (
          typeof payment.orderId !== "string" ||
          typeof payment.provider !== "string" ||
          typeof payment.phoneNumber !== "string" ||
          !Number.isFinite(Number(payment.amount)) ||
          typeof payment.currency !== "string"
        ) {
          throw new PawapayError(
            "The pending local payment record is invalid.",
            "invalid_response",
          );
        }

        const initiation = await pawapayRequest<{
          depositId?: string | null;
          status?: string;
          failureReason?: { failureCode?: string; failureMessage?: string };
        }>(
          "/v2/deposits",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              depositId,
              amount: String(payment.amount),
              currency: payment.currency,
              payer: {
                type: "MMO",
                accountDetails: {
                  phoneNumber: payment.phoneNumber,
                  provider: payment.provider,
                },
              },
            }),
          },
          config,
        );
        if (
          (initiation.depositId && initiation.depositId !== depositId) ||
          (initiation.status !== "REJECTED" &&
            initiation.depositId !== depositId)
        ) {
          throw new PawapayError(
            "PawaPay returned a different deposit ID.",
            "invalid_response",
          );
        }
        if (typeof initiation.status !== "string") {
          throw new PawapayError(
            "PawaPay returned an invalid deposit response.",
            "invalid_response",
          );
        }

        if (initiation.status === "REJECTED") {
          await adminDb.runTransaction(async (transaction) => {
            const paymentRef = paymentDoc.ref;
            const orderRef = adminDb.collection("orders").doc(payment.orderId);
            const [currentPayment, order] = await Promise.all([
              transaction.get(paymentRef),
              transaction.get(orderRef),
            ]);
            if (!currentPayment.exists || !order.exists) return;
            if (
              !["INITIATING", "DUPLICATE_IGNORED"].includes(
                String(currentPayment.data()?.status),
              )
            ) {
              return;
            }
            transaction.update(paymentRef, {
              status: "REJECTED",
              providerStatus: "REJECTED",
              failureReason: initiation.failureReason || null,
              updatedAt: new Date().toISOString(),
            });
            if (order.data()?.pawapayDepositId === depositId) {
              transaction.update(orderRef, {
                pawapayPaymentStatus: "REJECTED",
                paymentStatus: "failed",
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              });
            }
          });
          return "failed";
        }

        await adminDb.runTransaction(async (transaction) => {
          const orderRef = adminDb.collection("orders").doc(payment.orderId);
          const [currentPayment, currentOrder] = await Promise.all([
            transaction.get(paymentDoc.ref),
            transaction.get(orderRef),
          ]);
          if (
            !currentPayment.exists ||
            !["INITIATING", "DUPLICATE_IGNORED"].includes(
              String(currentPayment.data()?.status),
            )
          ) {
            return;
          }
          transaction.update(paymentDoc.ref, {
            status:
              initiation.status === "ACCEPTED" ||
              initiation.status === "DUPLICATE_IGNORED"
                ? initiation.status
                : "INITIATING",
            providerStatus: initiation.status,
            updatedAt: new Date().toISOString(),
          });
          if (
            currentOrder.exists &&
            currentOrder.data()?.pawapayDepositId === depositId &&
            String(currentOrder.data()?.paymentStatus).toLowerCase() !== "paid"
          ) {
            transaction.update(orderRef, {
              pawapayPaymentStatus: initiation.status,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
        });
        return "pending";
      }),
    );
    const failedChecks = outcomes.filter(
      (outcome) => outcome.status === "rejected",
    ).length;
    if (failedChecks > 0) {
      console.error("Some PawaPay deposit reconciliation checks failed.", {
        failedChecks,
      });
    }

    return NextResponse.json({
      checked: pendingPayments.size,
      failedChecks,
      results: outcomes.map((outcome) =>
        outcome.status === "fulfilled" ? outcome.value : "retry_required",
      ),
    });
  } catch (error) {
    console.error(
      "PawaPay deposit reconciliation failed.",
      error instanceof PawapayError
        ? { code: error.code, httpStatus: error.httpStatus }
        : "unexpected",
    );
    return NextResponse.json(
      { error: "Payment reconciliation is temporarily unavailable." },
      { status: 503 },
    );
  }
}
