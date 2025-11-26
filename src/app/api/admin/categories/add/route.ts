import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import { collection, addDoc } from "firebase/firestore";
import { CategoryType } from "../../../../../../type";
import { hasPermission, UserRole } from "@/lib/rbac/roles";
import { getToken } from "next-auth/jwt";

export async function POST(request: NextRequest) {
  try {
    // Check authentication and permissions
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = token.role as UserRole;
    if (!hasPermission(userRole, "canCreateProducts")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
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

    const docRef = await addDoc(collection(db, "categories"), categoryWithMeta);

    return NextResponse.json({
      ...categoryWithMeta,
      id: docRef.id,
    });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}