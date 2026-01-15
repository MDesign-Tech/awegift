import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { ProductType } from "../../../../../../type";
import { getServerSession } from "next-auth"; import { authOptions } from "@/lib/auth";
import { hasPermission, UserRole } from "@/lib/rbac/roles";
import { fetchUserFromFirestore } from "@/lib/firebase/adminUser";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - No session found" },
        { status: 401 }
      );
    }

    // Fetch user role
        const user = await fetchUserFromFirestore(session.user.id);
        if (!user) {
            return NextResponse.json(
              { error: "User deleted", code: "USER_DELETED" },
              { status: 401 }
            );
        }

    const userRole = session.user.role as UserRole;
    if (!userRole || !hasPermission(userRole, "canViewProducts")) {
      return NextResponse.json(
        { error: "Forbidden - Insufficient permissions" },
        { status: 403 }
      );
    }

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
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
