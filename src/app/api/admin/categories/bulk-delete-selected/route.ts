import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getServerSession } from "next-auth"; import { authOptions } from "@/lib/auth";
import { hasPermission, UserRole } from "@/lib/rbac/roles";

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - No session found" },
        { status: 401 }
      );
    }

    const userRole = session.user.role as UserRole;
    if (!userRole || !hasPermission(userRole, "canDeleteProducts")) {
      return NextResponse.json(
        { error: "Forbidden - Insufficient permissions" },
        { status: 403 }
      );
    }

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
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
