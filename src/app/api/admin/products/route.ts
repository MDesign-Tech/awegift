import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy, writeBatch, limit } from "firebase/firestore";
import { ProductType } from "../../../../../type";
import { hasPermission, UserRole } from "@/lib/rbac/roles";
import { getToken } from "next-auth/jwt";

export async function GET(request: NextRequest) {
  try {
    // Check authentication and permissions
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = token.role as UserRole;
    if (!hasPermission(userRole, "canViewProducts")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limitParam = parseInt(searchParams.get('limit') || '20');
    const offsetParam = parseInt(searchParams.get('offset') || '0');
    const searchQuery = searchParams.get('q')?.trim();
    const categoryFilter = searchParams.get('category')?.trim();

    // Fetch products with optional search and category filtering
    const productsRef = collection(db, "products");
    let productsQuery = query(productsRef, orderBy("meta.createdAt", "desc"));

    // First, get all documents to apply search/filtering
    const snapshot = await getDocs(productsQuery);
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
    if (categoryFilter) {
      allDocs = allDocs.filter(doc => {
        const data = doc.data() as ProductType;
        return data.category === categoryFilter;
      });
    }

    // Apply pagination
    const totalCount = allDocs.length;
    const paginatedDocs = allDocs.slice(offsetParam, offsetParam + limitParam);

    const products = paginatedDocs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as ProductType[];

    console.log("Fetched products:", products.length, "offset:", offsetParam, "limit:", limitParam, "search:", searchQuery, "category:", categoryFilter);

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

