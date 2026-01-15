import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getServerSession } from "next-auth"; import { authOptions } from "@/lib/auth";
import { hasPermission, UserRole } from "@/lib/rbac/roles";
import { fetchUserFromFirestore } from "@/lib/firebase/adminUser";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - No session found" },
        { status: 401 }
      );
    }

    // Fetch user role
        const user = await fetchUserFromFirestore(session.user.id);
        if (!user) {
            return NextResponse.json(
              { error: "User deleted", code: "USER_DELETED" },
              { status: 401 }
            );
        }

    const userRole = session.user.role as UserRole;
    if (!userRole || !hasPermission(userRole, "canViewOrders")) {
      return NextResponse.json(
        { error: "Forbidden - Insufficient permissions" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const q = searchParams.get('q') || '';
    const status = searchParams.get('status') || '';
    const paymentStatus = searchParams.get('paymentStatus') || '';

    // Build query
    let query: any = adminDb.collection("orders");

    // Apply filters
    if (status) {
      query = query.where('status', '==', status);
    }
    if (paymentStatus) {
      query = query.where('paymentStatus', '==', paymentStatus);
    }

    // Apply pagination first
    const ordersSnapshot = await query
      .orderBy('createdAt', 'desc')
      .limit(limit + 1) // +1 to check if there are more
      .offset(offset)
      .get();

    const hasMore = ordersSnapshot.size > limit;
    const ordersToReturn = ordersSnapshot.docs.slice(0, limit);

    // Fetch all users for name/email lookup
    const usersSnapshot = await adminDb.collection("users").get();
    const usersMap = new Map();
    usersSnapshot.docs.forEach((doc) => {
      const userData = doc.data();
      usersMap.set(doc.id, {
        name: userData.name || userData.displayName || "Unknown User",
        email: userData.email || "No Email",
      });
    });

    let orders = ordersToReturn.map((doc: any) => {
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
        paymentScreenshot: data.paymentScreenshot,
        deliveryAddress: data.orderAddress || data.shippingAddress,
        trackingNumber: data.trackingNumber,
      };
    });

    // Apply search filter if provided
    if (q) {
      orders = orders.filter(
        (order: any) =>
          order.id.toLowerCase().includes(q.toLowerCase()) ||
          order.userId.toLowerCase().includes(q.toLowerCase()) ||
          order.customerName?.toLowerCase().includes(q.toLowerCase()) ||
          order.customerEmail?.toLowerCase().includes(q.toLowerCase())
      );
    }

    return NextResponse.json({ orders, hasMore });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - No session found" },
        { status: 401 }
      );
    }

    // Fetch user role
    const user = await fetchUserFromFirestore(session.user.id);
    if (!user) {
        return NextResponse.json(
          { error: "User deleted", code: "USER_DELETED" },
          { status: 401 }
        );
    }

    const userRole = session.user.role as UserRole;
    if (!userRole || !hasPermission(userRole, "canUpdateOrders")) {
      return NextResponse.json(
        { error: "Forbidden - Insufficient permissions" },
        { status: 403 }
      );
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
      const orderRef = adminDb.collection("orders").doc(orderId);
      const orderDoc = await orderRef.get();

      if (orderDoc.exists) {
        const currentOrderData = orderDoc.data();
        const oldStatus = currentOrderData?.status;
        const newStatus = updateFields.status;

        // Handle statusHistory if status is changing
        let updatedFields = { ...updateFields, updatedAt: new Date().toISOString() };
        if (newStatus && newStatus !== oldStatus) {
          const statusHistory = currentOrderData?.statusHistory || [];
          const newHistoryEntry = {
            status: newStatus,
            changedBy: session.user.email || session.user.id,
            changedByRole: session.user.role,
            timestamp: new Date().toISOString(),
            notes: `Status updated to ${newStatus}`,
          };
          updatedFields.statusHistory = [...statusHistory, newHistoryEntry];
        }

        await orderRef.update(updatedFields);

        return NextResponse.json({
          success: true,
          updated: "orders_collection",
        });
      }
    } catch (orderError) {
      // Order not found in orders collection
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
          const currentOrder = orders[orderIndex];
          const oldStatus = currentOrder.status;
          const newStatus = updateFields.status;

          // Handle statusHistory if status is changing
          let updatedOrder = { ...currentOrder, ...updateFields, updatedAt: new Date().toISOString() };
          if (newStatus && newStatus !== oldStatus) {
            const statusHistory = currentOrder.statusHistory || [];
            const newHistoryEntry = {
              status: newStatus,
              changedBy: session.user.email || session.user.id,
              changedByRole: session.user.role,
              timestamp: new Date().toISOString(),
              notes: `Status updated to ${newStatus}`,
            };
            updatedOrder.statusHistory = [...statusHistory, newHistoryEntry];
          }

          orders[orderIndex] = updatedOrder;

          await userRef.update({ orders });
          return NextResponse.json({ success: true, updated: "user_orders" });
        }
      }
    }

    // If no userId provided, search all users for the order
    const usersSnapshot = await adminDb.collection("users").get();

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const orders = userData?.orders || [];

      const orderIndex = orders.findIndex((order: any) => order.id === orderId);
      if (orderIndex !== -1) {
        const currentOrder = orders[orderIndex];
        const oldStatus = currentOrder.status;
        const newStatus = updateFields.status;

        // Handle statusHistory if status is changing
        let updatedOrder = { ...currentOrder, ...updateFields, updatedAt: new Date().toISOString() };
        if (newStatus && newStatus !== oldStatus) {
          const statusHistory = currentOrder.statusHistory || [];
          const newHistoryEntry = {
            status: newStatus,
            changedBy: session.user.email || session.user.id,
            changedByRole: session.user.role,
            timestamp: new Date().toISOString(),
            notes: `Status updated to ${newStatus}`,
          };
          updatedOrder.statusHistory = [...statusHistory, newHistoryEntry];
        }

        orders[orderIndex] = updatedOrder;

        await adminDb.collection("users").doc(userDoc.id).update({ orders });
        return NextResponse.json({ success: true, updated: "user_orders" });
      }
    }

    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - No session found" },
        { status: 401 }
      );
    }

    // Fetch user role
    const user = await fetchUserFromFirestore(session.user.id);
    if (!user) {
        return NextResponse.json(
          { error: "User deleted", code: "USER_DELETED" },
          { status: 401 }
        );
    }

    const userRole = session.user.role as UserRole;
    if (!userRole || !hasPermission(userRole, "canDeleteOrders")) {
      return NextResponse.json(
        { error: "Forbidden - Insufficient permissions" },
        { status: 403 }
      );
    }

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
      // Order not found in orders collection
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
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
