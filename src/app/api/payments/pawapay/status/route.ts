import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { adminDb } from "@/lib/firebase/admin";
import { pawapayRequest, PawapayError } from "@/lib/payments/pawapay";
import {
  reconcilePawapayCheckout,
  type PawapayCheckoutData,
} from "@/lib/payments/pawapay-order";

export const runtime = "nodejs";

type CheckoutStatusResponse = {
  status?: string;
  data?: PawapayCheckoutData;
};

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orderId = request.nextUrl.searchParams.get("orderId");
  if (!orderId || orderId.length > 128) {
    return NextResponse.json({ error: "A valid order ID is required." }, { status: 400 });
  }

  try {
    const orderSnapshot = await adminDb.collection("orders").doc(orderId).get();
    if (!orderSnapshot.exists) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const order = orderSnapshot.data()!;
    if (order.userId !== session.user.id) {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }
    if (String(order.paymentStatus).toLowerCase() === "paid") {
      return NextResponse.json({ status: "paid", orderId });
    }
    if (typeof order.pawapayCheckoutId !== "string") {
      return NextResponse.json({ status: "not_started", orderId });
    }

    const checkout = await pawapayRequest<CheckoutStatusResponse>(
      `/v2/checkouts/${encodeURIComponent(order.pawapayCheckoutId)}`,
    );
    if (checkout.status !== "FOUND" || !checkout.data) {
      throw new PawapayError("PawaPay did not return checkout status.", "invalid_response");
    }
    const status = await reconcilePawapayCheckout(
      order.pawapayCheckoutId,
      checkout.data,
    );
    return NextResponse.json({ status, orderId });
  } catch (error) {
    console.error(
      "PawaPay payment status verification is unavailable.",
      error instanceof PawapayError
        ? { code: error.code, httpStatus: error.httpStatus }
        : "unexpected",
    );
    return NextResponse.json(
      {
        status: "pending",
        retryable: true,
        message: "We could not confirm the payment yet. Please try again.",
      },
      { status: 503 },
    );
  }
}
