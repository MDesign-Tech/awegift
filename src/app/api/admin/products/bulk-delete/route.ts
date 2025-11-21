import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, writeBatch } from "firebase/firestore";

export async function DELETE() {
  try {
    const productsRef = collection(db, "products");
    const snapshot = await getDocs(productsRef);

    if (snapshot.empty) {
      return NextResponse.json({ message: "No products to delete", deletedCount: 0 });
    }

    const batch = writeBatch(db);
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

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
