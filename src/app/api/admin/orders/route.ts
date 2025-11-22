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
} from "firebase/firestore";

export async function GET(request: NextRequest) {
  try {
    // Check authentication and permissions
    const token = await getToken({ req: request });
    if (!token || !token.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = token.role as any;
    if (!hasPermission(userRole, "canViewOrders")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Fetch all orders from orders collection
    const ordersRef = collection(db, "orders");
    const ordersSnapshot = await getDocs(ordersRef);

    const orders: any[] = ordersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Fetch all users to populate user data
    const usersRef = collection(db, "users");
    const usersSnapshot = await getDocs(usersRef);

    const usersMap = new Map();
    usersSnapshot.docs.forEach((doc) => {
      const userData = doc.data();
      usersMap.set(doc.id, {
        id: doc.id,
        name: userData.name || userData.displayName || "Unknown User",
        email: userData.email || "",
        role: userData.role || "user",
        createdAt: userData.createdAt || new Date().toISOString(),
        orders: [],
      });
    });

    // Group orders by userId
    const standaloneOrders: any[] = [];
    orders.forEach((order) => {
      if (order.userId && usersMap.has(order.userId)) {
        usersMap.get(order.userId).orders.push(order);
      } else {
        standaloneOrders.push(order);
      }
    });

    const users = Array.from(usersMap.values());

    // Sort users by creation date
    users.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json(
      {
        users,
        standaloneOrders,
        totalUsers: users.length,
        totalOrders:
          users.reduce((sum, user) => sum + user.orders.length, 0) +
          standaloneOrders.length,
      },
      { status: 200 }
    );
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
    const token = await getToken({ req: request });
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
        await updateDoc(orderRef, {
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
    const token = await getToken({ req: request });
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
