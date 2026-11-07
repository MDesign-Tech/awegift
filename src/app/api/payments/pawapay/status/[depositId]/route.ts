import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { adminDb } from "@/lib/firebase/admin";
import {
  getPawapayConfig,
  PawapayError,
  pawapayRequest,
} from "@/lib/payments/pawapay";
import {
  reconcilePawapayDeposit,
} from "@/lib/payments/pawapay-deposit";
import type { PawapayPaymentState } from "@/lib/payments/pawapay-deposit";

export const runtime = "nodejs";

type DepositStatusResponse = {
  status?: string;
  data?: Record<string, unknown>;
};

function paymentState(status: unknown): PawapayPaymentState {
  if (status === "COMPLETED") return "paid";
  if (status === "FAILED" || status === "REJECTED") return "failed";
  return "pending";
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ depositId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { depositId } = await params;
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      depositId,
    )
  ) {
    return NextResponse.json({ error: "A valid deposit ID is required." }, { status: 400 });
  }

  const paymentRef = adminDb.collection("pawapayPayments").doc(depositId);
  const paymentSnapshot = await paymentRef.get();
  if (!paymentSnapshot.exists) {
    return NextResponse.json({ error: "Payment not found." }, { status: 404 });
  }
  const payment = paymentSnapshot.data()!;
  if (payment.customerId !== session.user.id) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }
  if (payment.status === "paid" || payment.status === "duplicate_payment") {
    return NextResponse.json({ depositId, status: payment.status, state: payment.status });
  }
  if (payment.status === "FAILED" || payment.status === "REJECTED") {
    return NextResponse.json({ depositId, status: payment.status, state: "failed" });
  }

  try {
    const config = getPawapayConfig();
    const result = await pawapayRequest<DepositStatusResponse>(
      `/v2/deposits/${encodeURIComponent(depositId)}`,
      {},
      config,
    );
    if (result.status !== "FOUND" || !result.data) {
      return NextResponse.json({
        depositId,
        status: payment.status || "INITIATING",
        state: "pending",
        retryable: true,
      });
    }

    const state = await reconcilePawapayDeposit(depositId, result.data);
    return NextResponse.json({
      depositId,
      status: result.data.status || "UNKNOWN",
      state,
      retryable: state === "pending",
    });
  } catch (error) {
    console.error(
      "PawaPay deposit status verification is unavailable.",
      error instanceof PawapayError
        ? { code: error.code, httpStatus: error.httpStatus }
        : "unexpected",
    );
    return NextResponse.json(
      {
        depositId,
        status: payment.status || "INITIATING",
        state: paymentState(payment.status),
        retryable: true,
        message: "We could not confirm the payment yet. Please check again.",
      },
      { status: 503 },
    );
  }
}
