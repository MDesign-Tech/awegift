import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireRole } from "@/lib/server/auth-utils";

export async function DELETE(request: NextRequest) {
  try {
    const check = await requireRole(request, "canDeleteOrders");
    if (check instanceof NextResponse) return check;

    let orderIds: string[] | undefined;

    // Check if request has a body
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 0) {
      const body = await request.json();
      orderIds = body.orderIds;
    }

    const batch = adminDb.batch();

    if (orderIds && orderIds.length > 0) {
      // Delete selected orders
      orderIds.forEach((id) => {
        const docRef = adminDb.collection("orders").doc(id);
        batch.delete(docRef);
      });

      await batch.commit();

      return NextResponse.json({
        message: `Successfully deleted ${orderIds.length} orders`,
        deletedCount: orderIds.length
      });
    } else {
      // Delete all orders
      const snapshot = await adminDb.collection("orders").get();

      if (snapshot.empty) {
        return NextResponse.json({ message: "No orders to delete", deletedCount: 0 });
      }

      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      return NextResponse.json({
        message: "All orders deleted successfully",
        deletedCount: snapshot.docs.length
      });
    }
  } catch (error) {
    console.error("Error deleting orders:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}