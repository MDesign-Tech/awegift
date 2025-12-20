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

        // Try to delete from orders collection
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
