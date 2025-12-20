import { NextRequest, NextResponse } from "next/server";
import { hasPermission } from "@/lib/rbac/roles";
import { getToken } from "next-auth/jwt";
import { adminDb } from "@/lib/firebase/admin";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Check authentication and permissions
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = token.role as any;
    if (!hasPermission(userRole, "canUpdateOrders")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

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
        await orderRef.update({
          ...updates,
          updatedAt: new Date().toISOString(),
        });

        // TODO: Send notification if status changed (notification system not implemented)

        return NextResponse.json({
          success: true,
          updated: "orders_collection",
          orderId,
        });
      }
    } catch (orderError) {
      console.log("Order not found in orders collection, checking user orders");
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Check authentication and permissions
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = token.role as any;
    if (!hasPermission(userRole, "canDeleteOrders")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

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
      console.log("Order not found in orders collection, checking user orders");
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
    console.error("Error deleting order:", error);
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
    const { id } = await params;
    // Check authentication and permissions
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = token.role as any;
    if (!hasPermission(userRole, "canViewOrders")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

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
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
