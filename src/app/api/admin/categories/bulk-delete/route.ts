import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, writeBatch, doc } from "firebase/firestore";

export async function DELETE(request: Request) {
  try {
    let categoryIds: string[] | undefined;

    // Check if request has a body
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 0) {
      const body = await request.json();
      categoryIds = body.categoryIds;
    }

    if (categoryIds && categoryIds.length > 0) {
      // Delete selected categories
      const batch = writeBatch(db);
      categoryIds.forEach((id) => {
        const docRef = doc(db, "categories", id);
        batch.delete(docRef);
      });

      await batch.commit();

      return NextResponse.json({
        message: `Successfully deleted ${categoryIds.length} categories`,
        deletedCount: categoryIds.length
      });
    } else {
      // Delete all categories
      const categoriesRef = collection(db, "categories");
      const snapshot = await getDocs(categoriesRef);

      if (snapshot.empty) {
        return NextResponse.json({ message: "No categories to delete", deletedCount: 0 });
      }

      const batch = writeBatch(db);
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
