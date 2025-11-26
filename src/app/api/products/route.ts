import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, query, where, orderBy, limit, Query } from "firebase/firestore";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get("q");
    const limitParam = searchParams.get("limit");
    const category = searchParams.get("category");

    let productsQuery: Query;

    // Apply search filter if query provided
    if (searchQuery) {
      // For Firestore, we need to use where clauses for filtering
      // This is a simplified version - in production you'd want more sophisticated search
      productsQuery = query(
        collection(db, "products"),
        where("title", ">=", searchQuery),
        where("title", "<=", searchQuery + "\uf8ff"),
        limit(limitParam ? parseInt(limitParam) : 20)
      );
    } else {
      // Get all products with optional category filter
      if (category) {
        productsQuery = query(
          collection(db, "products"),
          where("category", "==", category),
          orderBy("createdAt", "desc"),
          limit(limitParam ? parseInt(limitParam) : 20)
        );
      } else {
        productsQuery = query(
          collection(db, "products"),
          orderBy("createdAt", "desc"),
          limit(limitParam ? parseInt(limitParam) : 20)
        );
      }
    }

    const querySnapshot = await getDocs(productsQuery);
    const products = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      products,
      total: products.length,
      skip: 0,
      limit: limitParam ? parseInt(limitParam) : 20
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}