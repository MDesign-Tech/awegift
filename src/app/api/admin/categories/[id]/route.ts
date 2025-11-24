import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { CategoryType } from "../../../../../../type";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const docRef = doc(db, "categories", params.id);
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
  { params }: { params: { id: string } }
) {
  try {
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

    const docRef = doc(db, "categories", params.id);
    await updateDoc(docRef, updatedData);

    return NextResponse.json({
      id: params.id,
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
  { params }: { params: { id: string } }
) {
  try {
    const docRef = doc(db, "categories", params.id);
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
