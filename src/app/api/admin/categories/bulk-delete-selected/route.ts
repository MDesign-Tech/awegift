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
    if (!hasPermission(userRole, "canCreateProducts")) { // Categories are related to products
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { categoryIds } = await request.json();

    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
      return NextResponse.json({ error: "Category IDs array required" }, { status: 400 });
    }

    const batch = writeBatch(db);
    categoryIds.forEach((categoryId: string) => {
      const categoryRef = doc(db, "categories", categoryId);
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