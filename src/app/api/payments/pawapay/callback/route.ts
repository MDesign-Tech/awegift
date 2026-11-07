import { NextRequest, NextResponse } from "next/server";

import { adminDb } from "@/lib/firebase/admin";
import {
  getPawapayConfig,
  PawapayError,
  pawapayRequest,
} from "@/lib/payments/pawapay";
import { reconcilePawapayDeposit } from "@/lib/payments/pawapay-deposit";
import { verifyPawapayCallbackSignature } from "@/lib/payments/pawapay-signature";
import {
  reconcilePawapayCheckout,
  type PawapayCheckoutData,
} from "@/lib/payments/pawapay-order";
import { isMatchingPawapayAmount } from "@/lib/payments/pawapay";

export const runtime = "nodejs";

type ProviderStatusResponse = {
  status?: string;
  data?: Record<string, unknown>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

async function handleDepositCallback(
  depositId: string,
  callback: Record<string, unknown>,
  config: ReturnType<typeof getPawapayConfig>,
) {
  const result = await pawapayRequest<ProviderStatusResponse>(
    `/v2/deposits/${encodeURIComponent(depositId)}`,
    {},
    config,
  );
  if (
    result.status !== "FOUND" ||
    !result.data ||
    result.data.depositId !== depositId
  ) {
    throw new PawapayError(
      "PawaPay could not verify the deposit callback.",
      "invalid_response",
    );
  }
  if (
    typeof callback.status === "string" &&
    callback.status !== result.data.status
  ) {
    throw new PawapayError(
      "PawaPay callback status does not match the deposit status.",
      "invalid_response",
    );
  }
  if (
    (callback.amount !== undefined &&
      Number(callback.amount) !== Number(result.data.amount)) ||
    (callback.currency !== undefined &&
      String(callback.currency).toUpperCase() !==
        String(result.data.currency).toUpperCase())
  ) {
    throw new PawapayError(
      "PawaPay callback payment details do not match the deposit status.",
      "invalid_response",
    );
  }

  const matchingPayments = await adminDb
    .collection("pawapayPayments")
    .where("depositId", "==", depositId)
    .limit(1)
    .get();
  if (matchingPayments.empty) {
    throw new PawapayError(
      "The PawaPay deposit callback has no matching local payment.",
      "invalid_response",
    );
  }

  const attempt = matchingPayments.docs[0].data();
  if (typeof attempt.checkoutId !== "string") {
    await reconcilePawapayDeposit(depositId, result.data);
    return;
  }

  if (
    !isMatchingPawapayAmount(
      result.data.amount,
      result.data.currency,
      Number(attempt.amount),
      String(attempt.currency),
    )
  ) {
    throw new PawapayError(
      "PawaPay deposit details do not match the stored payment.",
      "invalid_response",
    );
  }

  const checkout = await pawapayRequest<ProviderStatusResponse>(
    `/v2/checkouts/${encodeURIComponent(String(attempt.checkoutId))}`,
    {},
    config,
  );
  if (checkout.status !== "FOUND" || !checkout.data) {
    throw new PawapayError(
      "PawaPay could not verify the checkout for this deposit.",
      "invalid_response",
    );
  }
  await reconcilePawapayCheckout(
    String(attempt.checkoutId),
    checkout.data as PawapayCheckoutData,
  );
}

async function handleRefundCallback(refundId: string) {
  const result = await pawapayRequest<ProviderStatusResponse>(
    `/v2/refunds/${encodeURIComponent(refundId)}`,
  );
  if (
    result.status !== "FOUND" ||
    !result.data ||
    result.data.refundId !== refundId
  ) {
    throw new PawapayError(
      "PawaPay could not verify the refund callback.",
      "invalid_response",
    );
  }

  const refundRef = adminDb.collection("pawapayRefunds").doc(refundId);
  const refundSnapshot = await refundRef.get();
  if (!refundSnapshot.exists) {
    console.info(
      "Received a PawaPay refund callback with no local refund record.",
      refundId,
    );
    return;
  }

  const refund = refundSnapshot.data()!;
  const state = result.data.status;
  if (state !== "COMPLETED") {
    await refundRef.update({
      status: state,
      providerTransactionId: result.data.providerTransactionId || null,
      updatedAt: new Date().toISOString(),
    });
    return;
  }
  if (
    typeof refund.orderId !== "string" ||
    (typeof refund.depositId === "string" &&
      result.data.depositId !== refund.depositId)
  ) {
    throw new PawapayError(
      "PawaPay refund references do not match the stored refund.",
      "invalid_response",
    );
  }

  const orderRef = adminDb.collection("orders").doc(refund.orderId);
  const orderSnapshot = await orderRef.get();
  if (!orderSnapshot.exists) {
    throw new PawapayError(
      "The order for this PawaPay refund was not found.",
      "invalid_response",
    );
  }
  const order = orderSnapshot.data()!;
  if (
    !isMatchingPawapayAmount(
      result.data.amount,
      result.data.currency,
      Number(refund.amount),
      String(refund.currency),
    )
  ) {
    throw new PawapayError(
      "PawaPay refund details do not match the stored refund.",
      "invalid_response",
    );
  }

  await refundRef.update({
    status: state,
    providerTransactionId: result.data.providerTransactionId || null,
    updatedAt: new Date().toISOString(),
  });
  await orderRef.update({
    ...(Number(refund.amount) >= Number(order.totalAmount)
      ? { paymentStatus: "refunded" }
      : {}),
    pawapayRefundStatus: "COMPLETED",
    updatedAt: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 64_000) {
    return NextResponse.json(
      { error: "Callback payload is too large." },
      { status: 413 },
    );
  }

  const rawBody = await request.text();
  if (!rawBody || Buffer.byteLength(rawBody, "utf8") > 64_000) {
    return NextResponse.json(
      { error: "Invalid callback payload." },
      { status: 400 },
    );
  }

  let config: ReturnType<typeof getPawapayConfig>;
  try {
    config = getPawapayConfig();
    const requiredSignatureHeaders = [
      "signature",
      "signature-input",
      "signature-date",
      "content-digest",
      "content-type",
      "host",
    ];
    if (
      requiredSignatureHeaders.some(
        (header) => !request.headers.get(header),
      )
    ) {
      return NextResponse.json(
        { error: "Callback signature headers are required." },
        { status: 401 },
      );
    }
    const signatureIsValid = await verifyPawapayCallbackSignature(
      request,
      rawBody,
      config,
    );
    if (!signatureIsValid) {
      return NextResponse.json(
        { error: "Callback signature is invalid." },
        { status: 401 },
      );
    }
  } catch (error) {
    console.error(
      "PawaPay callback signature verification is unavailable.",
      error instanceof PawapayError
        ? { code: error.code, httpStatus: error.httpStatus }
        : "unexpected",
    );
    return NextResponse.json(
      { error: "Callback could not be verified." },
      { status: 503 },
    );
  }

  let event: unknown;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { error: "Invalid callback JSON." },
      { status: 400 },
    );
  }
  if (!isRecord(event)) {
    return NextResponse.json(
      { error: "Invalid callback payload." },
      { status: 400 },
    );
  }

  try {
    if (typeof event.checkoutId === "string" && event.checkoutId) {
      const response = await pawapayRequest<ProviderStatusResponse>(
        `/v2/checkouts/${encodeURIComponent(event.checkoutId)}`,
      );
      if (response.status !== "FOUND" || !response.data) {
        throw new PawapayError(
          "PawaPay could not verify the checkout callback.",
          "invalid_response",
        );
      }
      const status = await reconcilePawapayCheckout(
        event.checkoutId,
        response.data as PawapayCheckoutData,
      );
      return NextResponse.json({ received: true, status });
    }

    if (typeof event.depositId === "string" && event.depositId) {
      await handleDepositCallback(event.depositId, event, config);
      return NextResponse.json({ received: true });
    }

    if (typeof event.refundId === "string" && event.refundId) {
      await handleRefundCallback(event.refundId);
      return NextResponse.json({ received: true });
    }

    return NextResponse.json(
      { error: "Callback reference is missing." },
      { status: 400 },
    );
  } catch (error) {
    console.error(
      "PawaPay callback could not be verified or processed.",
      error instanceof PawapayError
        ? { code: error.code, httpStatus: error.httpStatus }
        : "unexpected",
    );
    return NextResponse.json(
      { error: "Callback could not be verified." },
      { status: 503 },
    );
  }
}
