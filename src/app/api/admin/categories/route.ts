import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, addDoc, query, orderBy, getCountFromServer, where } from "firebase/firestore";
import { CategoryType } from "../../../../../type";
import { hasPermission, UserRole } from "@/lib/rbac/roles";
import { getToken } from "next-auth/jwt";

export async function GET(request: NextRequest) {
  try {
    // Allow unauthenticated access for public product browsing
    // Authentication is only required for admin operations (POST, PUT, DELETE)

    const categoriesRef = collection(db, "categories");
    const q = query(categoriesRef, orderBy("name"));
    const snapshot = await getDocs(q);

    // Get all categories first
    const categories = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as CategoryType[];

    // Calculate product count for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        try {
          const productsRef = collection(db, "products");
          const productsQuery = query(productsRef, where("categories", "array-contains", category.name));
          const productsSnapshot = await getCountFromServer(productsQuery);
          const productCount = productsSnapshot.data().count;

          return {
            ...category,
            productCount,
          };
        } catch (error) {
          console.error(`Error counting products for category ${category.slug}:`, error);
          return {
            ...category,
            productCount: 0,
          };
        }
      })
    );

    return NextResponse.json(categoriesWithCounts);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication and permissions
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = token.role as UserRole;
    if (!hasPermission(userRole, "canCreateProducts")) { // Categories are related to products
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const categoryData: Omit<CategoryType, 'id' | 'meta'> = await request.json();

    // Validate required fields
    if (!categoryData.name || !categoryData.slug || !categoryData.description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Add timestamps
    const now = new Date().toISOString();
    const categoryWithMeta = {
      ...categoryData,
      meta: {
        createdAt: now,
        updatedAt: now,
      },
    };

    const docRef = await addDoc(collection(db, "categories"), categoryWithMeta);

    return NextResponse.json({
      id: docRef.id,
      ...categoryWithMeta,
    });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
