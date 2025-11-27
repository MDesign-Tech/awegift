import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { ProductType } from "../../../../type";

export async function GET(request: NextRequest) {
  try {
    // Allow public browsing (no auth needed for GET)
    const { searchParams } = new URL(request.url);

    const limitParam = parseInt(searchParams.get("limit") || "20");
    const offsetParam = parseInt(searchParams.get("offset") || "0");
    const searchQuery = searchParams.get("q")?.trim();
    const categoryFilter = searchParams.get("category")?.trim();

    // Fetch products ordered by creation date
    const productsRef = collection(db, "products");
    const productsQuery = query(productsRef, orderBy("meta.createdAt", "desc"));
    const snapshot = await getDocs(productsQuery);

    let allDocs = snapshot.docs;

    // Search filter
    if (searchQuery) {
      allDocs = allDocs.filter((doc) => {
        const data = doc.data() as ProductType;
        return (
          data.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          data.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
          data.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
    }

    // Category filter
    if (categoryFilter) {
      allDocs = allDocs.filter((doc) => {
        const data = doc.data() as ProductType;
        return data.category === categoryFilter;
      });
    }

    // Total number of matched products
    const totalCount = allDocs.length;

    let products: ProductType[];

    // ✔ limit=0 → return ALL products
    if (limitParam === 0) {
      products = allDocs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ProductType[];
    } else {
      // Normal pagination
      const paginatedDocs = allDocs.slice(
        offsetParam,
        offsetParam + limitParam
      );

      products = paginatedDocs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ProductType[];
    }

    return NextResponse.json({
      products,
      total: totalCount,
      hasMore: limitParam === 0 ? false : totalCount > offsetParam + limitParam,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
