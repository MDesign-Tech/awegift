import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { ProductType } from "../../../../../../type";
import { requireRole } from "@/lib/server/auth-utils";

// GET product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const check = await requireRole(request, "canViewProducts");
    if (check instanceof NextResponse) return check;

    const docRef = adminDb.collection("products").doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const data = docSnap.data() as any;
    const { id: _, ...productData } = data;
    const product = { id: docSnap.id, ...productData } as ProductType;
    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT (update) product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const check = await requireRole(request, "canUpdateProducts");
    if (check instanceof NextResponse) return check;

    const productData: Partial<ProductType> = await request.json();

    // Validate provided fields
    if ((productData.title !== undefined && productData.title === "") ||
        (productData.price !== undefined && productData.price === null) ||
        (productData.categories !== undefined && (!Array.isArray(productData.categories) || productData.categories.length === 0))) {
      return NextResponse.json({ error: "Invalid field values" }, { status: 400 });
    }

    const docRef = adminDb.collection("products").doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
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

    await docRef.update(updatedData);
    console.log("Product updated successfully:", id);

    const data = docSnap.data() as any;
    const { id: _, ...docProductData } = data;
    return NextResponse.json({ id, ...docProductData, ...updatedData });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const check = await requireRole(request, "canDeleteProducts");
    if (check instanceof NextResponse) return check;

    const docRef = adminDb.collection("products").doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await docRef.delete();
    return NextResponse.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
