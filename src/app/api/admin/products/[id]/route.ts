import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { ProductType } from "../../../../../../type";
import { hasPermission, UserRole } from "@/lib/rbac/roles";
import { getToken } from "next-auth/jwt";

// GET product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } } // params is not a Promise
) {
  try {
    const { id } = params;

    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = token.role as UserRole;
    if (!hasPermission(userRole, "canViewProducts")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const docRef = doc(db, "products", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const product = { id: docSnap.id, ...docSnap.data() } as ProductType & { id: string };
    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT (update) product
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = token.role as UserRole;
    if (!hasPermission(userRole, "canUpdateProducts")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const productData: Partial<ProductType> = await request.json();

    // Validate required fields only if present
    if (productData.title === "" || productData.price == null || (productData.categories && (!Array.isArray(productData.categories) || productData.categories.length === 0))) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const docRef = doc(db, "products", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Get existing product data
    const existingData = docSnap.data() as ProductType;

    // Prepare update object for partial updates
    const updatedData: any = { ...productData };

    // Update meta
    const now = new Date().toISOString();
    updatedData.meta = {
      ...existingData.meta,
      updatedAt: now,
      createdAt: existingData.meta?.createdAt || now, // Preserve createdAt or set if missing
      barcode: existingData.meta?.barcode || "",
      qrCode: existingData.meta?.qrCode || "",
    };

    await updateDoc(docRef, updatedData);

    return NextResponse.json({ id, ...docSnap.data(), ...updatedData });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE product
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = token.role as UserRole;
    if (!hasPermission(userRole, "canDeleteProducts")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const docRef = doc(db, "products", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await deleteDoc(docRef);
    return NextResponse.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
