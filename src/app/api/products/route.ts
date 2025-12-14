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
    const categoryFilters = searchParams.getAll("category").map(cat => cat.trim()).filter(Boolean);

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
    if (categoryFilters.length > 0) {
      allDocs = allDocs.filter((doc) => {
        const data = doc.data() as ProductType;
        return data.categories && data.categories.some(cat => categoryFilters.includes(cat));
      });
    }

    // Active filter - only return active products
    allDocs = allDocs.filter((doc) => {
      const data = doc.data() as ProductType;
      return data.isActive !== false;
    });

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
