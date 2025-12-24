import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireRole } from "@/lib/server/auth-utils";

export async function DELETE(request: NextRequest) {
  try {
    const check = await requireRole(request, "canDeleteProducts");
    if (check instanceof NextResponse) return check;

    const snapshot = await adminDb.collection("products").limit(5000).get();

    if (snapshot.empty) {
      return NextResponse.json({ message: "No products to delete", deletedCount: 0 });
    }

    // For admin SDK, delete individually or use batch
    const deletePromises = snapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(deletePromises);

    return NextResponse.json({
      message: "All products deleted successfully",
      deletedCount: snapshot.docs.length
    });
  } catch (error) {
    console.error("Error deleting all products:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
