import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getToken } from "next-auth/jwt";
import { hasPermission, UserRole } from "@/lib/rbac/roles";

export async function DELETE(request: NextRequest) {
  try {
    const token = await getToken({ req: request });

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized - No session found" },
        { status: 401 }
      );
    }

    const userRole = token.role as UserRole;
    if (!userRole || !hasPermission(userRole, "canDeleteProducts")) {
      return NextResponse.json(
        { error: "Forbidden - Insufficient permissions" },
        { status: 403 }
      );
    }

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