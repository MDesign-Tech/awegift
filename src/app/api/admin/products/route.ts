import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { ProductType } from "../../../../../type";
import { requireRole } from "@/lib/server/auth-utils";

export async function GET(request: NextRequest) {
  try {
    const check = await requireRole(request, "canViewProducts");
    if (check instanceof NextResponse) return check;

    const { searchParams } = new URL(request.url);
    const limitParam = parseInt(searchParams.get('limit') || '20');
    const offsetParam = parseInt(searchParams.get('offset') || '0');
    const searchQuery = searchParams.get('q')?.trim();
    const categoryFilters = searchParams.getAll('category').map(cat => cat.trim()).filter(Boolean);

    // Fetch products with optional search and category filtering
    const snapshot = await adminDb.collection("products").limit(5000).get();
    let allDocs = snapshot.docs;

    // Apply search filter if provided
    if (searchQuery) {
      allDocs = allDocs.filter(doc => {
        const data = doc.data() as ProductType;
        return data.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
               data.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
               data.description.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }

    // Apply category filter if provided
    if (categoryFilters.length > 0) {
      allDocs = allDocs.filter(doc => {
        const data = doc.data() as ProductType;
        return data.categories && data.categories.some(cat => categoryFilters.includes(cat));
      });
    }

    // Apply pagination
    const totalCount = allDocs.length;
    const paginatedDocs = allDocs.slice(offsetParam, offsetParam + limitParam);

    const products = paginatedDocs.map(doc => {
      const data = doc.data() as any;
      const { id: _, ...productData } = data;
      return {
        id: doc.id,
        ...productData,
      };
    }) as ProductType[];

    console.log("Fetched products:", products.length, "offset:", offsetParam, "limit:", limitParam, "search:", searchQuery, "categories:", categoryFilters);

    return NextResponse.json({
      products,
      total: totalCount,
      hasMore: totalCount > offsetParam + limitParam
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

