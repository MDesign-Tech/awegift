import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { ProductType } from "../../../../../type";
import { getToken } from "next-auth/jwt";
import { hasPermission, UserRole } from "@/lib/rbac/roles";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });

    // Debug logging for production issues
    console.log("Products API - Token check:", {
      hasToken: !!token,
      tokenKeys: token ? Object.keys(token) : null,
      userAgent: request.headers.get('user-agent'),
      cookies: request.cookies.getAll().map(c => c.name),
      nextAuthSessionToken: request.cookies.get('next-auth.session-token')?.value ? 'present' : 'missing',
      nextAuthUrl: process.env.NEXTAUTH_URL,
      nodeEnv: process.env.NODE_ENV
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

