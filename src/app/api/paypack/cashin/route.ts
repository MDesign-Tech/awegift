import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import admin from "firebase-admin";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { adminDb } from "@/lib/firebase/admin";
import {
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
} from "@/lib/orderStatus";

const PAYPACK_BASE_URL = "https://payments.paypack.rw/api";

type PaypackTokenResponse = {
  access?: string;
  refresh?: string;
  expires?: string;
};

type PaypackCashinResponse = {
  ref?: string;
  status?: string;
  amount?: number;
};

async function paypackRequest<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${PAYPACK_BASE_URL}${path}`, {
    ...init,
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || data?.error || "PayPack rejected the request.");
  }

  return data as T;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId, phone } = await request.json();
    if (typeof orderId !== "string" || !/^07\d{8}$/.test(phone || "")) {
      return NextResponse.json(
        { error: "Enter a valid Rwanda Mobile Money number, for example 0781990310." },
        { status: 400 },
      );
    }

    const orderRef = adminDb.collection("orders").doc(orderId);
    const orderSnapshot = await orderRef.get();
    if (!orderSnapshot.exists) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = orderSnapshot.data()!;
    if (order.userId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    if (order.paymentStatus === PAYMENT_STATUSES.PAID) {
      return NextResponse.json({ error: "This order has already been paid." }, { status: 409 });
    }
    if (order.paymentStatus === PAYMENT_STATUSES.PENDING && order.paypackTransactionRef) {
      return NextResponse.json(
        { error: "A Mobile Money payment prompt is already pending for this order." },
        { status: 409 },
      );
    }

    const amount = Math.round(Number(order.totalAmount));
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      return NextResponse.json({ error: "The order total is invalid." }, { status: 400 });
    }

    const clientId = process.env.PAYPACK_CLIENT_ID;
    const clientSecret = process.env.PAYPACK_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      console.error("PayPack credentials are not configured.");
      return NextResponse.json({ error: "Mobile Money is not configured yet." }, { status: 503 });
    }

    const token = await paypackRequest<PaypackTokenResponse>("/auth/agents/authorize", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret }),
    });
    if (!token.access) throw new Error("PayPack did not return an access token.");

    const idempotencyKey = crypto.randomUUID().replace(/-/g, "");
    const payment = await paypackRequest<PaypackCashinResponse>("/transactions/cashin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token.access}`,
        "Idempotency-Key": idempotencyKey,
        "X-Webhook-Mode": process.env.PAYPACK_WEBHOOK_MODE === "development" ? "development" : "production",
      },
      body: JSON.stringify({ amount, number: phone }),
    });
    if (!payment.ref) throw new Error("PayPack did not return a transaction reference.");

    await orderRef.update({
      paymentMethod: PAYMENT_METHODS.MTN,
      paymentStatus: PAYMENT_STATUSES.PENDING,
      paypackTransactionRef: payment.ref,
      paypackPhone: phone,
      paypackAmount: amount,
      paypackIdempotencyKey: idempotencyKey,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      paymentHistory: [
        ...(order.paymentHistory || []),
        {
          status: PAYMENT_STATUSES.PENDING,
          timestamp: new Date().toISOString(),
          updatedBy: session.user.email || session.user.id,
          userRole: "user",
          method: PAYMENT_METHODS.MTN,
          notes: `PayPack Mobile Money request created (${payment.ref})`,
        },
      ],
    });

    return NextResponse.json({
      success: true,
      reference: payment.ref,
      status: payment.status || "pending",
      message: "Confirm the payment prompt on your phone.",
    });
  } catch (error) {
    console.error("PayPack Cashin error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to start Mobile Money payment." },
      { status: 502 },
    );
  }
}
