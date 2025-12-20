import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { ProductType } from "../../../../../type";

export async function GET(request: NextRequest) {
  try {
    // Allow public browsing (no auth needed for GET)
    const { searchParams } = new URL(request.url);

    const limitParam = parseInt(searchParams.get("limit") || "20");
    const offsetParam = parseInt(searchParams.get("offset") || "0");

    // Fetch products ordered by creation date
    const productsRef = adminDb.collection("products");
    const productsQuery = productsRef.orderBy("meta.createdAt", "desc");
    const snapshot = await productsQuery.get();

    let allDocs = snapshot.docs;

    // Filter for active and featured products
    allDocs = allDocs.filter((doc) => {
      const data = doc.data() as ProductType;
      return data.isActive !== false && data.isFeatured === true;
    });

    // Total number of matched products
    const totalCount = allDocs.length;

    let products: ProductType[];

    // ✔ limit=0 → return ALL products
    if (limitParam === 0) {
      products = allDocs.map((doc) => {
        const data = doc.data() as any;
        const { id: _, ...productData } = data;
        return {
          id: doc.id,
          ...productData,
        };
      }) as ProductType[];
    } else {
      // Normal pagination
      const paginatedDocs = allDocs.slice(
        offsetParam,
        offsetParam + limitParam
      );

      products = paginatedDocs.map((doc) => {
        const data = doc.data() as any;
        const { id: _, ...productData } = data;
        return {
          id: doc.id,
          ...productData,
        };
      }) as ProductType[];
    }

    return NextResponse.json({
      products,
      total: totalCount,
      hasMore: limitParam === 0 ? false : totalCount > offsetParam + limitParam,
    });
  } catch (error) {
    console.error("Error fetching featured products:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}