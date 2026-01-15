// app/api/products/route.ts
export const runtime = "nodejs"; // ✅ Force Node runtime

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { adminDb } from "@/lib/firebase/admin";
import { ProductType } from "../../../../../type";
import { hasPermission, UserRole } from "@/lib/rbac/roles";
import { fetchUserFromFirestore } from "@/lib/firebase/adminUser";

export async function GET() {
  try {
    // Get session using getServerSession (production-safe)
    const session = await getServerSession(authOptions);
    const headersInstance = await headers();

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

    // Parse query params from referer or fallback to localhost
    const url = new URL(headersInstance.get("referer") || "http://localhost");
    const limitParam = parseInt(url.searchParams.get("limit") || "20");
    const offsetParam = parseInt(url.searchParams.get("offset") || "0");
    const searchQuery = url.searchParams.get("q")?.trim();
    const categoryFilters = url.searchParams
      .getAll("category")
      .map(c => c.trim())
      .filter(Boolean);

    // Fetch all products from Firestore (up to 5000)
    const snapshot = await adminDb.collection("products").get();
    let docs = snapshot.docs;

    // Apply search filter
    if (searchQuery) {
      docs = docs.filter(doc => {
        const p = doc.data() as ProductType;
        return (
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
    }

    // Apply category filter
    if (categoryFilters.length > 0) {
      docs = docs.filter(doc => {
        const p = doc.data() as ProductType;
        return p.categories?.some(cat => categoryFilters.includes(cat));
      });
    }

    const totalCount = docs.length;

    // Apply pagination
    const paginatedDocs = docs.slice(offsetParam, offsetParam + limitParam);

    // Map products safely (avoid duplicate 'id')
    const products = paginatedDocs.map(doc => {
      const { id: _removed, ...data } = doc.data() as any;
      return { id: doc.id, ...data };
    });

    return NextResponse.json({
      products,
      total: totalCount,
      hasMore: totalCount > offsetParam + limitParam,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
