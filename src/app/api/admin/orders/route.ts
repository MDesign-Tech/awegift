import { NextRequest, NextResponse } from "next/server";
import { hasPermission } from "@/lib/rbac/roles";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/firebase/config";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import { getVisibleOrderStatuses } from "@/lib/orderStatus";
import { sendOrderStatusNotification } from "@/lib/notifications/orderNotifications";

export async function GET(request: NextRequest) {
  try {
    // Check authentication and permissions
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.role || !token.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = token.role as any;
    if (!hasPermission(userRole, "canViewOrders")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Fetch all orders and filter based on role
    const ordersQuery = collection(db, "orders");
    const ordersSnapshot = await getDocs(ordersQuery);

    // Fetch all users for name/email lookup
    const usersQuery = collection(db, "users");
    const usersSnapshot = await getDocs(usersQuery);
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
        shippingAddress: data.shippingAddress,
        trackingNumber: data.trackingNumber,
      };
    });

    // Filter based on role
    if (userRole === "user") {
      // Regular users can only see their own orders
      orders = orders.filter((order) => order.customerEmail === token.email);
    } else if (userRole !== "admin" && userRole !== "accountant") {
      // Role-based filtering for staff (packer, deliveryman)
      const visibleStatuses = getVisibleOrderStatuses(userRole);
      orders = orders.filter((order) => visibleStatuses.includes(order.status));
    }
    // Admin and accountant see all orders (no filter)

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
    // Check authentication and permissions
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = token.role as any;
    if (!hasPermission(userRole, "canUpdateOrders")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

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
      const orderRef = doc(db, "orders", orderId);
      const orderDoc = await getDoc(orderRef);

      if (orderDoc.exists()) {
        const currentOrderData = orderDoc.data();
        const oldStatus = currentOrderData.status;
        const newStatus = updateFields.status;

        await updateDoc(orderRef, {
          ...updateFields,
          updatedAt: new Date().toISOString(),
        });

        // Send notification if status changed
        if (newStatus && oldStatus !== newStatus) {
          try {
            await sendOrderStatusNotification({
              orderId,
              userId: currentOrderData.userId,
              userEmail: currentOrderData.shippingAddress?.email || currentOrderData.customerEmail,
              userPhone: currentOrderData.shippingAddress?.phone,
              oldStatus,
              newStatus,
              orderDetails: {
                totalAmount: currentOrderData.totalAmount || currentOrderData.amount || 0,
                items: currentOrderData.items || [],
                orderId: currentOrderData.orderId || orderId,
              },
            });
          } catch (notificationError) {
            console.error("Failed to send order notification:", notificationError);
            // Don't fail the order update if notification fails
          }
        }

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
      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const orders = userData.orders || [];

        const orderIndex = orders.findIndex(
          (order: any) => order.id === orderId
        );
        if (orderIndex !== -1) {
          orders[orderIndex] = {
            ...orders[orderIndex],
            ...updateFields,
            updatedAt: new Date().toISOString(),
          };

          await updateDoc(userRef, { orders });
          return NextResponse.json({ success: true, updated: "user_orders" });
        }
      }
    }

    // If no userId provided, search all users for the order
    const usersRef = collection(db, "users");
    const usersSnapshot = await getDocs(usersRef);

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const orders = userData.orders || [];

      const orderIndex = orders.findIndex((order: any) => order.id === orderId);
      if (orderIndex !== -1) {
        orders[orderIndex] = {
          ...orders[orderIndex],
          ...updateFields,
          updatedAt: new Date().toISOString(),
        };

        await updateDoc(userDoc.ref, { orders });
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
    // Check authentication and permissions
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = token.role as any;
    if (!hasPermission(userRole, "canDeleteOrders")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { orderId, userId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 });
    }

    // Try to delete from orders collection first
    try {
      const orderRef = doc(db, "orders", orderId);
      const orderDoc = await getDoc(orderRef);

      if (orderDoc.exists()) {
        await deleteDoc(orderRef);
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
      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const orders = userData.orders || [];

        const filteredOrders = orders.filter(
          (order: any) => order.id !== orderId
        );

        if (filteredOrders.length !== orders.length) {
          await updateDoc(userRef, { orders: filteredOrders });
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
