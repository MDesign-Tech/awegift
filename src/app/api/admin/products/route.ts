// app/api/products/route.ts
export const runtime = "nodejs"; // ✅ Force Node runtime

import { NextResponse } from "next/server";
import { headers, cookies } from "next/headers";
import { getToken } from "next-auth/jwt";
import { adminDb } from "@/lib/firebase/admin";
import { ProductType } from "../../../../../type";
import { hasPermission, UserRole } from "@/lib/rbac/roles";

export async function GET() {
  try {
    const h = await headers();
        const c = await cookies();
        // Build a Node-style "req" object for getToken
    const reqForToken = {
      headers: Object.fromEntries(h),
      cookies: Object.fromEntries(
        c.getAll().map(c => [c.name, c.value])
      ),
    } as any;

    const token = await getToken({
      req: reqForToken,
      secret: process.env.NEXTAUTH_SECRET,
    });

    console.log("Products API - Token check:", {
      secret: process.env.NEXTAUTH_SECRET,
      hasToken: !!token,
      tokenKeys: token ? Object.keys(token) : null,
      cookies: c.getAll().map(c => c.name),
      nodeEnv: process.env.NODE_ENV,
    });

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized - No session found" },
        { status: 401 }
      );
    }

    const userRole = token.role as UserRole;
    if (!userRole || !hasPermission(userRole, "canViewProducts")) {
      return NextResponse.json(
        { error: "Forbidden - Insufficient permissions" },
        { status: 403 }
      );
    }

    // Fetch query params
    const url = new URL(h.get("referer") || "http://localhost");
    const limitParam = parseInt(url.searchParams.get("limit") || "20");
    const offsetParam = parseInt(url.searchParams.get("offset") || "0");
    const searchQuery = url.searchParams.get("q")?.trim();
    const categoryFilters = url.searchParams
      .getAll("category")
      .map(c => c.trim())
      .filter(Boolean);

    // Fetch products from Firestore
    const snapshot = await adminDb.collection("products").limit(5000).get();
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
      const data = doc.data() as ProductType;
      const { id: _removed, ...rest } = data as any; // remove Firestore id if exists
      return {
        id: doc.id, // use Firestore doc id
        ...rest,
      };
    });

    console.log(
      "Fetched products:",
      products.length,
      "offset:",
      offsetParam,
      "limit:",
      limitParam,
      "search:",
      searchQuery,
      "categories:",
      categoryFilters
    );

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
