import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getServerSession } from "next-auth"; import { authOptions } from "@/lib/auth";
import { hasPermission, UserRole } from "@/lib/rbac/roles";
import { fetchUserFromFirestore } from "@/lib/firebase/adminUser";

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - No session found" },
        { status: 401 }
      );
    }

    // Fetch user role
        const user = await fetchUserFromFirestore(session.user.id);
        if (!user) {
            return NextResponse.json(
              { error: "User deleted", code: "USER_DELETED" },
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
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
