import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireRole } from "@/lib/server/auth-utils";

export async function DELETE(request: Request) {
  try {
    const check = await requireRole(request as any, "canDeleteProducts");
    if (check instanceof NextResponse) return check;
    let categoryIds: string[] | undefined;

    // Check if request has a body
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 0) {
      const body = await request.json();
      categoryIds = body.categoryIds;
    }

    const batch = adminDb.batch();

    if (categoryIds && categoryIds.length > 0) {
      // Delete selected categories
      categoryIds.forEach((id) => {
        const docRef = adminDb.collection("categories").doc(id);
        batch.delete(docRef);
      });

      await batch.commit();

      return NextResponse.json({
        message: `Successfully deleted ${categoryIds.length} categories`,
        deletedCount: categoryIds.length
      });
    } else {
      // Delete all categories
      const snapshot = await adminDb.collection("categories").get();

      if (snapshot.empty) {
        return NextResponse.json({ message: "No categories to delete", deletedCount: 0 });
      }

      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      return NextResponse.json({
        message: "All categories deleted successfully",
        deletedCount: snapshot.docs.length
      });
    }
  } catch (error) {
    console.error("Error deleting categories:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
