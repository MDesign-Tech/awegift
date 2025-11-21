import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, addDoc, query, orderBy, getCountFromServer, where } from "firebase/firestore";
import { CategoryType } from "@/components/admin/CategoryForm";

export async function GET() {
  try {
    const categoriesRef = collection(db, "categories");
    const q = query(categoriesRef, orderBy("name"));
    const snapshot = await getDocs(q);

    const categories = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as CategoryType[];

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
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
      id: docRef.id,
      ...categoryWithMeta,
    });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
