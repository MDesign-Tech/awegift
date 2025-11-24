import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { hasPermission } from "@/lib/rbac/roles";
import { db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { fetchUserFromFirestore } from "@/lib/firebase/userService";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orderId = params.id;

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

    const userRole = user.role as any;

    // Get the order
    const orderRef = doc(db, "orders", orderId);
    const orderDoc = await getDoc(orderRef);

    if (!orderDoc.exists()) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = orderDoc.data();

    // Check permissions
    if (userRole === "user") {
      // Regular users can only view their own orders
      if (order.userEmail !== session.user.email) {
        return NextResponse.json(
          { error: "You don't have permission to view this order" },
          { status: 403 }
        );
      }
    } else {
      // Staff/admin can view orders based on their permissions
      if (!hasPermission(userRole, "canViewOrders")) {
        return NextResponse.json(
          { error: "Insufficient permissions" },
          { status: 403 }
        );
      }
    }

    // Format the order data to match frontend expectations
    const formattedOrder = {
      id: orderDoc.id,
      orderId: order.orderId,
      amount: order.total || "0", // Map total to amount
      currency: "USD", // Default currency
      status: order.status,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt?.toDate?.()?.toISOString() || order.createdAt,
      updatedAt: order.updatedAt?.toDate?.()?.toISOString() || order.updatedAt,
      items: order.items || [],
      customerEmail: order.userEmail || order.email,
      customerName: order.customerName || order.userEmail?.split('@')[0] || "Customer",
      shippingAddress: order.shippingAddress,
      trackingNumber: order.trackingNumber,
      estimatedDelivery: order.estimatedDelivery,
      paymentMethod: order.paymentMethod,
    };

    return NextResponse.json({ order: formattedOrder });
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}