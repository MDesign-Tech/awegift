import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireRole } from "@/lib/server/auth-utils";
import { getToken } from "next-auth/jwt";

export async function GET(request: NextRequest) {
  try {
    const check = await requireRole(request, "canViewOrders");
    if (check instanceof NextResponse) return check;

    // Fetch all orders and filter based on role
    const ordersSnapshot = await adminDb.collection("orders").limit(5000).get();

    // Fetch all users for name/email lookup
    const usersSnapshot = await adminDb.collection("users").limit(5000).get();
    const usersMap = new Map();
    usersSnapshot.docs.forEach((doc) => {
      const userData = doc.data();
      usersMap.set(doc.id, {
        name: userData.name || userData.displayName || "Unknown User",
        email: userData.email || "No Email",
      });
    });

    let orders = ordersSnapshot.docs.map((doc) => {
      const data = doc.data();
      const userInfo = usersMap.get(data.userId) || { name: "Unknown User", email: "No Email" };

      return {
        id: doc.id,
        orderId: data.orderId,
        amount: data.total || "0",
        currency: "USD",
        status: data.status,
        paymentStatus: data.paymentStatus,
        createdAt:
          data.createdAt?.toDate?.()?.toISOString() ||
          new Date().toISOString(),
        updatedAt:
          data.updatedAt?.toDate?.()?.toISOString() ||
          new Date().toISOString(),
        items: data.items || [],
        customerEmail: userInfo.email,
        customerName: userInfo.name,
        userId: data.userId,
        totalAmount: data.totalAmount || 0,
        paymentMethod: data.paymentMethod,
        deliveryAddress: data.orderAddress || data.shippingAddress,
        trackingNumber: data.trackingNumber,
      };
    });

    // Admin sees all orders (no filter)

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const check = await requireRole(request, "canUpdateOrders");
    if (check instanceof NextResponse) return check;

    const body = await request.json();
    const { orderId, userId, updates, status, paymentStatus } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 });
    }

    // Build updates object from individual fields or use provided updates
    const updateFields = updates || {};
    if (status) updateFields.status = status;
    if (paymentStatus) updateFields.paymentStatus = paymentStatus;

    // If orderId exists in orders collection, update it there
    try {
      const orderRef = adminDb.collection("orders").doc(orderId);
      const orderDoc = await orderRef.get();

      if (orderDoc.exists) {
        const currentOrderData = orderDoc.data();
        const oldStatus = currentOrderData?.status;
        const newStatus = updateFields.status;

        await orderRef.update({
          ...updateFields,
          updatedAt: new Date().toISOString(),
        });

        return NextResponse.json({
          success: true,
          updated: "orders_collection",
        });
      }
    } catch (orderError) {
      console.log("Order not found in orders collection, checking user orders");
    }

    // If userId provided, update the order in user's orders array
    if (userId) {
      const userRef = adminDb.collection("users").doc(userId);
      const userDoc = await userRef.get();

      if (userDoc.exists) {
        const userData = userDoc.data();
        const orders = userData?.orders || [];

        const orderIndex = orders.findIndex(
          (order: any) => order.id === orderId
        );
        if (orderIndex !== -1) {
          orders[orderIndex] = {
            ...orders[orderIndex],
            ...updateFields,
            updatedAt: new Date().toISOString(),
          };

          await userRef.update({ orders });
          return NextResponse.json({ success: true, updated: "user_orders" });
        }
      }
    }

    // If no userId provided, search all users for the order
    const usersSnapshot = await adminDb.collection("users").limit(5000).get();

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const orders = userData?.orders || [];

      const orderIndex = orders.findIndex((order: any) => order.id === orderId);
      if (orderIndex !== -1) {
        orders[orderIndex] = {
          ...orders[orderIndex],
          ...updateFields,
          updatedAt: new Date().toISOString(),
        };

        await adminDb.collection("users").doc(userDoc.id).update({ orders });
        return NextResponse.json({ success: true, updated: "user_orders" });
      }
    }

    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const check = await requireRole(request, "canDeleteOrders");
    if (check instanceof NextResponse) return check;

    const { orderId, userId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 });
    }

    // Try to delete from orders collection first
    try {
      const orderRef = adminDb.collection("orders").doc(orderId);
      const orderDoc = await orderRef.get();

      if (orderDoc.exists) {
        await orderRef.delete();
        return NextResponse.json({
          success: true,
          deleted: "orders_collection",
        });
      }
    } catch (orderError) {
      console.log("Order not found in orders collection, checking user orders");
    }

    // If userId provided, remove the order from user's orders array
    if (userId) {
      const userRef = adminDb.collection("users").doc(userId);
      const userDoc = await userRef.get();

      if (userDoc.exists) {
        const userData = userDoc.data();
        const orders = userData?.orders || [];

        const filteredOrders = orders.filter(
          (order: any) => order.id !== orderId
        );

        if (filteredOrders.length !== orders.length) {
          await userRef.update({ orders: filteredOrders });
          return NextResponse.json({ success: true, deleted: "user_orders" });
        }
      }
    }

    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  } catch (error) {
    console.error("Error deleting order:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
