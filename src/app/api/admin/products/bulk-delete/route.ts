import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, writeBatch } from "firebase/firestore";
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
    if (!hasPermission(userRole, "canDeleteProducts")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

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
