import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { CategoryType } from "../../../../type";

export async function GET(request: NextRequest) {
  try {
    const categoriesRef = adminDb.collection("categories");
    const q = categoriesRef.orderBy("name");
    const snapshot = await q.get();

    // Get all categories first
    const categories = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as CategoryType[];

    // Calculate product count for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        try {
          const productsRef = adminDb.collection("products");
          const productsQuery = productsRef.where("categories", "array-contains", category.name);
          const productsSnapshot = await productsQuery.get();
          const productCount = productsSnapshot.size;

          return {
            ...category,
            productCount,
          };
        } catch (error) {
          console.error(`Error counting products for category ${category.slug}:`, error);
          return {
            ...category,
            productCount: 0,
          };
        }
      })
    );

    return NextResponse.json(categoriesWithCounts);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
