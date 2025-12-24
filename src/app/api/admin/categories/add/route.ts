import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { CategoryType } from "../../../../../../type";
import { requireRole } from "@/lib/server/auth-utils";

export async function POST(request: NextRequest) {
  try {
    const check = await requireRole(request, "canCreateProducts");
    if (check instanceof NextResponse) return check;

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
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}