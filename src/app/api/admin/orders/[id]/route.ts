import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission, UserRole } from "@/lib/rbac/roles";
import {
  createOrderReadyNotification,
  createOrderCompletedNotification,
  createOrderCancelledNotification,
  createOrderFailedNotification,
  createOrderRefundedNotification,
  createAdminOrderCancelledNotification
} from "@/lib/notification/helpers";
import { fetchUserFromFirestore } from "@/lib/firebase/adminUser";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const orderId = id;
    const body = await request.json();
    const { userId, updates } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 });
    }

    // Try to update order in orders collection first
    try {
      const orderRef = adminDb.collection("orders").doc(orderId);
      const orderDoc = await orderRef.get();

      if (orderDoc.exists) {
        const currentOrder = orderDoc.data();

        // Prepare update data
        const updateData: any = {
          ...updates,
          updatedAt: new Date().toISOString(),
        };

        // If status is being updated, add to statusHistory
        if (updates.status && updates.status !== currentOrder?.status) {
          const statusHistory = currentOrder?.statusHistory || [];
          statusHistory.push({
            status: updates.status,
            changedBy: session.user.email,
            changedByRole: userRole,
            timestamp: new Date().toISOString(),
            notes: updates.notes || `Status updated to ${updates.status}`,
          });
          updateData.statusHistory = statusHistory;
        }

        await orderRef.update(updateData);

        // Send notification if status changed
        if (updates.status && updates.status !== currentOrder?.status && currentOrder?.userId) {
          try {
            switch (updates.status.toLowerCase()) {
              case 'ready':
                await createOrderReadyNotification(currentOrder.userId, currentOrder.customerEmail, currentOrder.customerName, orderId, currentOrder);
                break;
              case 'completed':
                await createOrderCompletedNotification(currentOrder.userId, currentOrder.customerEmail, currentOrder.customerName, orderId, currentOrder);
                break;
              case 'cancelled':
                await createOrderCancelledNotification(currentOrder.userId, currentOrder.customerEmail, currentOrder.customerName, orderId, currentOrder);
                await createAdminOrderCancelledNotification('admin', orderId, currentOrder.customerName || 'Customer', currentOrder);
                break;
              case 'failed':
                await createOrderFailedNotification(currentOrder.userId, currentOrder.customerEmail, currentOrder.customerName, orderId, currentOrder);
                break;
              case 'refunded':
                await createOrderRefundedNotification(currentOrder.userId, currentOrder.customerEmail, currentOrder.customerName, orderId, currentOrder.totalAmount, 'RWF', currentOrder);
                break;
              default:
                // No specific notification for other statuses
                break;
            }
          } catch (notificationError) {
            // Failed to send notification
          }
        }

        return NextResponse.json({
          success: true,
          updated: "orders_collection",
          orderId,
        });
      }
    } catch (orderError) {
      // Order not found in orders collection
    }

    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const orderId = id;

    if (!orderId) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 });
    }

    let deleted = false;
    const deletedFrom: string[] = [];

    // Try to delete from orders collection first
    try {
      const orderRef = adminDb.collection("orders").doc(orderId);
      const orderDoc = await orderRef.get();

      if (orderDoc.exists) {
        await orderRef.delete();
        deleted = true;
        deletedFrom.push("orders_collection");
      }
    } catch (orderError) {
      // Order not found in orders collection
    }

    if (!deleted) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Order deleted successfully",
      orderId,
      deletedFrom,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const orderId = id;

    if (!orderId) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 });
    }

    // Try to get order from orders collection first
    try {
      const orderRef = adminDb.collection("orders").doc(orderId);
      const orderDoc = await orderRef.get();

      if (orderDoc.exists) {
        return NextResponse.json({
          order: { id: orderDoc.id, ...orderDoc.data() },
          source: "orders_collection",
        });
      }
    } catch (orderError) {
      console.log("Order not found in orders collection, checking user orders");
    }

    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
