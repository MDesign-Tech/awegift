

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { OrderData, OrderStatusHistory } from "../../../../../type";
import { OrderStatus } from "@/lib/orderStatus";
import { UserRole } from "@/lib/rbac/roles";
import { PaymentStatus, canUpdatePaymentStatus } from "@/lib/orderStatus";
import { auth } from "../../../../../auth";
import { fetchUserFromFirestore } from "@/lib/firebase/userService";

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
    const orderRef = doc(db, "orders", orderId);
    const orderDoc = await getDoc(orderRef);

    if (!orderDoc.exists()) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const currentOrder = orderDoc.data() as OrderData;

    if (currentOrder.userId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const currentPaymentStatus = currentOrder.paymentStatus;

    // Check if user has permission to update payment status
    const userRole = user.role || "user";
    if (!canUpdatePaymentStatus(userRole, currentOrder.paymentMethod as any, currentPaymentStatus, paymentStatus, paymentMethod)) {
      return NextResponse.json({ error: "Insufficient permissions to update payment status" }, { status: 403 });
    }

    const updateData: any = {
      updatedAt: serverTimestamp(),
      updatedBy: session.user.email,
    };

    // Handle payment status update
    if (paymentStatus && paymentStatus !== currentPaymentStatus) {
      updateData.paymentStatus = paymentStatus;
    }

    // Handle payment method update
    if (paymentMethod && paymentMethod !== currentOrder.paymentMethod) {
      updateData.paymentMethod = paymentMethod;
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
    await updateDoc(orderRef, updateData);

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
