import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { CategoryType } from "../../../../../../type";
import { hasPermission, UserRole } from "@/lib/rbac/roles";
import { getToken } from "next-auth/jwt";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const docRef = doc(db, "categories", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    const category = {
      id: docSnap.id,
      ...docSnap.data(),
    } as CategoryType;

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Check authentication and permissions
    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = token.role as UserRole;
    if (!hasPermission(userRole, "canUpdateProducts")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const categoryData: Partial<Omit<CategoryType, 'id' | 'meta'>> = await request.json();

    // Validate required fields
    if (!categoryData.name || !categoryData.slug || !categoryData.description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Update timestamp
    const updatedData = {
      ...categoryData,
      meta: {
        updatedAt: new Date().toISOString(),
      },
    };

    const docRef = doc(db, "categories", id);
    await updateDoc(docRef, updatedData);

    return NextResponse.json({
      id,
      ...updatedData,
    });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Check authentication and permissions
    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = token.role as UserRole;
    if (!hasPermission(userRole, "canDeleteProducts")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const docRef = doc(db, "categories", id);
    await deleteDoc(docRef);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
