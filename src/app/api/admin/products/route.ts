import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy, writeBatch } from "firebase/firestore";
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

    // Fetch products
    const productsRef = collection(db, "products");
    const snapshot = await getDocs(productsRef);

    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as (ProductType & { id: string })[];
    console.log("Fetched products:", products);

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
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
    if (!hasPermission(userRole, "canCreateProducts")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const productData: ProductType = await request.json();

    // Validate required fields
    if (!productData.title || !productData.price || !productData.category) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Add timestamps
    const now = new Date().toISOString();
    const productWithMeta = {
      ...productData,
      meta: {
        createdAt: now,
        updatedAt: now,
        barcode: productData.meta?.barcode || "",
        qrCode: productData.meta?.qrCode || "",
      },
    };

    const docRef = await addDoc(collection(db, "products"), productWithMeta);

    return NextResponse.json({
      ...productWithMeta,
      id: docRef.id,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
