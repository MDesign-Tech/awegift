import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireRole } from "@/lib/server/auth-utils";

export async function DELETE(request: NextRequest) {
  try {
    const check = await requireRole(request, "canDeleteProducts");
    if (check instanceof NextResponse) return check;

    const { productIds } = await request.json();

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ error: "Product IDs array required" }, { status: 400 });
    }

    const validProductIds: string[] = [];

    productIds.forEach((productId: any) => {
      const cleanedId = String(productId).trim();
      if (cleanedId && cleanedId !== '') {
        validProductIds.push(cleanedId);
      }
    });

    if (validProductIds.length === 0) {
      return NextResponse.json({ error: "No valid product IDs provided" }, { status: 400 });
    }

    const deletePromises = validProductIds.map(productId =>
      adminDb.collection("products").doc(productId).delete()
    );

    await Promise.all(deletePromises);

    return NextResponse.json({
      message: "Products deleted successfully",
      deletedCount: productIds.length
    });
  } catch (error) {
    console.error("Error deleting selected products:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}