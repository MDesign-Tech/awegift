

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { OrderData, OrderStatusHistory } from "../../../../../type";
import { OrderStatus } from "@/lib/orderStatus";
import { UserRole } from "@/lib/rbac/roles";
import { PaymentStatus, PaymentMethod, canUpdatePaymentStatus } from "@/lib/orderStatus";
import { auth } from "@/auth";
import { fetchUserFromFirestore } from "@/lib/firebase/userService.server";
import { createOrderPaidNotification } from "@/lib/notification/helpers";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      orderId,
      paymentStatus,
      paymentMethod,
      paymentScreenshot,
    } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Fetch user from Firestore
    const user = await fetchUserFromFirestore(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Users can only update their own orders
    const orderRef = adminDb.collection("orders").doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const currentOrder = orderDoc.data() as OrderData;

    if (currentOrder.userId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const currentPaymentStatus = currentOrder.paymentStatus;
    const normalizedCurrentMethod = currentOrder.paymentMethod?.toLowerCase() as PaymentMethod;
    const normalizedNewMethod = paymentMethod?.toLowerCase() as PaymentMethod;

    // Check if user has permission to update payment status
    const userRole = user.role || "user";
    if (!canUpdatePaymentStatus(userRole, normalizedCurrentMethod, currentPaymentStatus, paymentStatus, normalizedNewMethod)) {
      return NextResponse.json({ error: "Insufficient permissions to update payment status" }, { status: 403 });
    }

    const updateData: any = {
      updatedAt: new Date(),
      updatedBy: session.user.email,
    };

    // Handle payment status update
    if (paymentStatus && paymentStatus !== currentPaymentStatus) {
      updateData.paymentStatus = paymentStatus;
    }

    // Handle payment method update
    if (paymentMethod && paymentMethod.toLowerCase() !== currentOrder.paymentMethod?.toLowerCase()) {
      updateData.paymentMethod = paymentMethod.toLowerCase();
    }

    // Handle payment screenshot update
    if (paymentScreenshot) {
      updateData.paymentScreenshot = paymentScreenshot;
    }

    // Add status history entry if payment status changed
    if (paymentStatus && paymentStatus !== currentPaymentStatus) {
      const statusHistoryEntry: OrderStatusHistory = {
        status: currentOrder.status,
        changedBy: session.user.email,
        changedByRole: userRole as UserRole,
        timestamp: new Date().toISOString(),
        notes: `Payment status updated to ${paymentStatus}`,
      };

      updateData.statusHistory = [...(currentOrder.statusHistory || []), statusHistoryEntry];
    }

    // Update the order
    await orderRef.update(updateData);

    // Send notification if payment status changed to paid
    if (paymentStatus && paymentStatus !== currentPaymentStatus && paymentStatus === "paid") {
      try {
        await createOrderPaidNotification(
          user.id,
          orderId,
          currentOrder.totalAmount,
          'RWF'
        );
      } catch (notificationError) {
        console.error("Failed to send payment status notification:", notificationError);
      }
    }

    return NextResponse.json({
      message: "Order updated successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
