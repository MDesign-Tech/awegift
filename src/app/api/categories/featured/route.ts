import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { CategoryType } from "../../../../../type";
import { isProductAvailable } from "@/lib/productLimits";

export async function GET(request: NextRequest) {
  try {
    const categoriesRef = adminDb.collection("categories");
    const q = categoriesRef.orderBy("name");
    const snapshot = await q.get();

    const categories = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as CategoryType[];

    const productsSnapshot = await adminDb.collection("products").get();
    const activeCategories = new Map<string, number>();
    for (const productDoc of productsSnapshot.docs) {
      const product = productDoc.data();
      const available =
        product.isActive !== false && isProductAvailable(product);
      if (!available || !Array.isArray(product.categories)) continue;
      for (const name of new Set(product.categories)) {
        if (typeof name !== "string") continue;
        const key = name.trim().toLocaleLowerCase();
        if (key) activeCategories.set(key, (activeCategories.get(key) || 0) + 1);
      }
    }

    const uniqueCategories = new Map<string, CategoryType>();
    const seenCategoryNames = new Set<string>();
    for (const category of categories) {
      const key = category.name.trim().toLocaleLowerCase();
      const count = activeCategories.get(key) || 0;
      if (
        category.isFeatured === true &&
        count > 0 &&
        !uniqueCategories.has(category.slug.trim().toLocaleLowerCase()) &&
        !seenCategoryNames.has(key)
      ) {
        uniqueCategories.set(category.slug.trim().toLocaleLowerCase(), {
          ...category,
          productCount: count,
        });
        seenCategoryNames.add(key);
      }
    }
    return NextResponse.json([...uniqueCategories.values()]);
  } catch (error) {
    console.error("Error fetching featured categories:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
