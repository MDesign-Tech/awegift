import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, writeBatch, doc } from "firebase/firestore";
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

    const { productIds } = await request.json();

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ error: "Product IDs array required" }, { status: 400 });
    }

    const batch = writeBatch(db);
    productIds.forEach((productId: string) => {
      const productRef = doc(db, "products", productId);
      batch.delete(productRef);
    });

    await batch.commit();

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