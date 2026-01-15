import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { OrderData, OrderStatusHistory } from "../../../../../type";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchUserFromFirestore } from "@/lib/firebase/adminUser";
import { createOrderCompletedNotification } from "@/lib/notification/helpers";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId, status } = await request.json();

    if (!orderId || !status) {
      return NextResponse.json(
        { error: "Order ID and status are required" },
        { status: 400 }
      );
    }

    // Only allow marking as completed
    if (status !== "completed") {
      return NextResponse.json(
        { error: "Invalid status. Only 'completed' is allowed for user updates." },
        { status: 400 }
      );
    }

    // Fetch user from Firestore
    const user = await fetchUserFromFirestore(session.user.id);
    if (!user) {
      return NextResponse.json(
        { error: "User deleted", code: "USER_DELETED" },
        { status: 401 }
      );
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

    // Check if order can be marked as completed
    if (currentOrder.status !== "ready" || currentOrder.paymentStatus !== "paid") {
      return NextResponse.json(
        { error: "Order cannot be marked as completed. It must be ready and payment must be paid." },
        { status: 400 }
      );
    }

    const updateData: any = {
      status: "completed",
      updatedAt: new Date(),
      updatedBy: session.user.email,
    };

    // Add status history entry
    const statusHistoryEntry: OrderStatusHistory = {
      status: "completed",
      changedBy: session.user.email,
      changedByRole: user.role as any,
      timestamp: new Date().toISOString(),
      notes: "Order marked as completed by customer",
    };

    updateData.statusHistory = [...(currentOrder.statusHistory || []), statusHistoryEntry];

    // Update the order
    await orderRef.update(updateData);

    // Send notification
    try {
      await createOrderCompletedNotification(user.id, currentOrder.customerEmail, currentOrder.customerName, orderId, currentOrder);
    } catch (notificationError) {
      console.error("Failed to send completion notification:", notificationError);
    }

    return NextResponse.json({
      message: "Order marked as completed successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 }
    );
  }
}