import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireRole } from "@/lib/server/auth-utils";

export async function DELETE(request: NextRequest) {
  try {
    const check = await requireRole(request, "canDeleteProducts"); // Categories are related to products
    if (check instanceof NextResponse) return check;

    const { categoryIds } = await request.json();

    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
      return NextResponse.json({ error: "Category IDs array required" }, { status: 400 });
    }

    const batch = adminDb.batch();
    categoryIds.forEach((categoryId: string) => {
      const categoryRef = adminDb.collection("categories").doc(categoryId);
      batch.delete(categoryRef);
    });

    await batch.commit();

    return NextResponse.json({
      message: "Categories deleted successfully",
      deletedCount: categoryIds.length
    });
  } catch (error) {
    console.error("Error deleting selected categories:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}