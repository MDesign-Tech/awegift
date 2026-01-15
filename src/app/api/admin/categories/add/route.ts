import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { CategoryType } from "../../../../../../type";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission, UserRole } from "@/lib/rbac/roles";
import { fetchUserFromFirestore } from "@/lib/firebase/adminUser";

export async function POST(request: NextRequest) {
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
    if (!userRole || !hasPermission(userRole, "canCreateProducts")) {
      return NextResponse.json(
        { error: "Forbidden - Insufficient permissions" },
        { status: 403 }
      );
    }

    const categoryData: Omit<CategoryType, 'id' | 'meta'> = await request.json();

    // Validate required fields
    if (!categoryData.name || !categoryData.slug || !categoryData.description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Add timestamps
    const now = new Date().toISOString();
    const categoryWithMeta = {
      ...categoryData,
      meta: {
        createdAt: now,
        updatedAt: now,
      },
    };

    const docRef = await adminDb.collection("categories").add(categoryWithMeta);

    return NextResponse.json({
      ...categoryWithMeta,
      id: docRef.id,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
