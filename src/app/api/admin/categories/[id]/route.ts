import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { CategoryType } from "../../../../../../type";
import { requireRole } from "@/lib/server/auth-utils";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const docRef = adminDb.collection("categories").doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const check = await requireRole(request as any, "canUpdateProducts");
    if (check instanceof NextResponse) return check;

    const partialData: Partial<CategoryType> = await request.json();

    // Update timestamp
    const updatedData = {
      ...partialData,
      meta: {
        updatedAt: new Date().toISOString(),
      },
    };

    const docRef = adminDb.collection("categories").doc(id);
    await docRef.update(updatedData);

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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const check = await requireRole(request as any, "canUpdateProducts");
    if (check instanceof NextResponse) return check;

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

    const docRef = adminDb.collection("categories").doc(id);
    await docRef.update(updatedData);

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
    const check = await requireRole(request as any, "canDeleteProducts");
    if (check instanceof NextResponse) return check;

    const docRef = adminDb.collection("categories").doc(id);
    await docRef.delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

