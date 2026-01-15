import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { adminDb } from "@/lib/firebase/admin";
import { generateReceiptPdf } from "@/lib/pdfGenerator";
import { OrderData, UserData } from "@../../../type";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orderId = req.nextUrl.searchParams.get("orderId");
    if (!orderId) return NextResponse.json({ error: "Order ID required" }, { status: 400 });

    // Get order data
    const orderDoc = await adminDb.collection("orders").doc(orderId).get();
    if (!orderDoc.exists) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const orderData = orderDoc.data();
    if (!orderData) return NextResponse.json({ error: "Order data not found" }, { status: 404 });

    const order: OrderData = {
      id: orderDoc.id,
      ...orderData
    } as OrderData;

    // Verify ownership
    if (order.userId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if order is eligible for receipt (completed/paid)
    const eligibleStatuses = ["ready", "completed"];
    const isEligible = eligibleStatuses.includes(order.status) &&
                      (order.paymentStatus === "paid" ||
                       (order.paymentMethod === "mtn" || order.paymentMethod === "airtel"));

    if (!isEligible) {
      return NextResponse.json({
        error: "Receipt not available. Order must be completed and paid."
      }, { status: 400 });
    }

    // Get user data for receipt
    const userDoc = await adminDb.collection("users").doc(order.userId).get();
    if (!userDoc.exists) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const userData = userDoc.data();
    if (!userData) return NextResponse.json({ error: "User data not found" }, { status: 404 });

    const user: UserData = {
      id: userDoc.id,
      ...userData
    } as UserData;

    // Generate PDF on-demand
    const pdfBuffer = await generateReceiptPdf(order, user);

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=awegift-receipt-${orderId.slice(-8)}.pdf`,
      },
    });

  } catch (error) {
    console.error("Receipt generation error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}