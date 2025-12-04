import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, addDoc, query, orderBy, getCountFromServer, where } from "firebase/firestore";
import { CategoryType } from "../../../../type";

export async function GET(request: NextRequest) {
  try {
    const categoriesRef = collection(db, "categories");
    const q = query(categoriesRef, orderBy("name"));
    const snapshot = await getDocs(q);

    // Get all categories first
    const categories = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as CategoryType[];

    // Calculate product count for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        try {
          const productsRef = collection(db, "products");
          const productsQuery = query(productsRef, where("category", "==", category.name));
          const productsSnapshot = await getCountFromServer(productsQuery);
          const productCount = productsSnapshot.data().count;

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