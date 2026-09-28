import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import admin from "firebase-admin";

import { adminDb } from "@/lib/firebase/admin";
import { PAYMENT_METHODS, PAYMENT_STATUSES } from "@/lib/orderStatus";

export const runtime = "nodejs";

type PaypackWebhook = {
  kind?: string;
  event_id?: string;
  data?: {
    ref?: string;
    kind?: string;
    amount?: number;
    client?: string;
    provider?: string;
    status?: string;
    processed_at?: string;
  };
};

// PayPack calls HEAD before sending the POST webhook.
export function HEAD() {
  return new NextResponse(null, { status: 200 });
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.PAYPACK_WEBHOOK_SECRET;
  const receivedSignature = request.headers.get("x-paypack-signature");

  if (!webhookSecret || !receivedSignature) {
    return NextResponse.json({ error: "Webhook signature is missing." }, { status: 401 });
  }

  const rawBody = await request.text();
  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody, "utf8")
    .digest("base64");

  const received = Buffer.from(receivedSignature, "utf8");
  const expected = Buffer.from(expectedSignature, "utf8");
  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  let event: PaypackWebhook;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const payment = event.data;
  if (event.kind !== "transaction:processed" || payment?.kind !== "CASHIN" || !payment.ref) {
    return NextResponse.json({ received: true });
  }

  const matchingOrders = await adminDb
    .collection("orders")
    .where("paypackTransactionRef", "==", payment.ref)
    .limit(1)
    .get();

  // Acknowledging unknown events prevents unnecessary retries, without changing an order.
  if (matchingOrders.empty) return NextResponse.json({ received: true });

  const orderRef = matchingOrders.docs[0].ref;
  await adminDb.runTransaction(async (transaction) => {
    const orderSnapshot = await transaction.get(orderRef);
    if (!orderSnapshot.exists) return;

    const order = orderSnapshot.data()!;
    // The reference, amount, and customer number must all agree with our saved request.
    if (
      order.paypackTransactionRef !== payment.ref ||
      Math.round(Number(order.paypackAmount)) !== Math.round(Number(payment.amount)) ||
      order.paypackPhone !== payment.client
    ) {
      console.error("Rejected PayPack webhook with mismatched payment details", payment.ref);
      return;
    }

    const paymentStatus = payment.status === "successful"
      ? PAYMENT_STATUSES.PAID
      : PAYMENT_STATUSES.FAILED;
    // PayPack can retry webhooks. Do not repeat a completed update.
    if (order.paymentStatus === paymentStatus) return;

    const method = payment.provider?.toLowerCase() === "airtel"
      ? PAYMENT_METHODS.AIRTEL
      : PAYMENT_METHODS.MTN;

    transaction.update(orderRef, {
      paymentMethod: method,
      paymentStatus,
      paypackProcessedAt: payment.processed_at || new Date().toISOString(),
      paypackEventId: event.event_id || null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      paymentHistory: [
        ...(order.paymentHistory || []),
        {
          status: paymentStatus,
          timestamp: new Date().toISOString(),
          updatedBy: "PayPack webhook",
          userRole: "system",
          method,
          notes: `PayPack ${payment.status || "processed"} (${payment.ref})`,
        },
      ],
    });
  });

  return NextResponse.json({ received: true });
}
