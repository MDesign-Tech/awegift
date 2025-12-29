import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { ProductType } from "../../../../../../type";
import { requireRole } from "@/lib/server/auth-utils";

export async function GET(request: NextRequest) {
  try {
    const check = await requireRole(request, "canViewProducts");
    if (check instanceof NextResponse) return check;

    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get('q') || '';
    const limitParam = parseInt(searchParams.get('limit') || '10');

    if (!searchQuery.trim()) {
      return NextResponse.json({ products: [] });
    }

    // Fetch all products and filter client-side for simplicity
    // In production, you might want to use Firestore queries for better performance
    const snapshot = await adminDb.collection("products").limit(5000).get();

    const allProducts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as (ProductType & { id: string })[];

    // Filter products based on search query
    const filteredProducts = allProducts.filter(product =>
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.categories && product.categories.some(cat => cat.toLowerCase().includes(searchQuery.toLowerCase()))) ||
      product.brand.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, limitParam);

    return NextResponse.json({ products: filteredProducts });
  } catch (error) {
    console.error("Error searching products:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}