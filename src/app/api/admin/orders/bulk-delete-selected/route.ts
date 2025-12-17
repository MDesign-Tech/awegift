import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { hasPermission } from "@/lib/rbac/roles";
import { getToken } from "next-auth/jwt";

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

    const { orderIds } = await request.json();

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: "Order IDs array is required" },
        { status: 400 }
      );
    }

    const results = {
      deleted: [] as string[],
      notFound: [] as string[],
      errors: [] as { orderId: string; error: string }[],
    };

    for (const orderId of orderIds) {
      try {
        let deleted = false;

        // Try to delete from orders collection first
        try {
          const orderRef = adminDb.collection("orders").doc(orderId);
          const orderDoc = await orderRef.get();

          if (orderDoc.exists) {
            await orderRef.delete();
            deleted = true;
          }
        } catch (orderError) {
          console.log(
            `Order ${orderId} not found in orders collection, checking user orders`
          );
        }

        // Search through all users and remove the order from any user's orders array
        const usersSnapshot = await adminDb.collection("users").get();

        for (const userDoc of usersSnapshot.docs) {
          const userData = userDoc.data();
          if (userData.orders && Array.isArray(userData.orders)) {
            const originalOrdersLength = userData.orders.length;
            const filteredOrders = userData.orders.filter(
              (order: any) => order.id !== orderId
            );

            // If order was found and removed
            if (filteredOrders.length !== originalOrdersLength) {
              await userDoc.ref.update({
                orders: filteredOrders,
                updatedAt: new Date().toISOString(),
              });
              deleted = true;
            }
          }
        }

        if (deleted) {
          results.deleted.push(orderId);
        } else {
          results.notFound.push(orderId);
        }
      } catch (error) {
        console.error(`Error deleting order ${orderId}:`, error);
        results.errors.push({
          orderId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Deleted ${results.deleted.length} orders successfully`,
      results,
    });
  } catch (error) {
    console.error("Error in bulk delete selected orders:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
