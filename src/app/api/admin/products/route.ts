import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy, writeBatch } from "firebase/firestore";
import { ProductType } from "@/components/admin/ProductForm";

export async function GET() {
  try {
    const productsRef = collection(db, "products");
    const q = query(productsRef, orderBy("basicInformation.title"));
    const snapshot = await getDocs(q);

    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as (ProductType & { id: string })[];

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const productData: ProductType = await request.json();

    // Validate required fields
    if (!productData.basicInformation.title || !productData.pricing.price || !productData.basicInformation.category) {
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
        barcode: productData.metadata?.barcode || "",
        qrCode: productData.metadata?.qrCode || "",
      },
    };

    const docRef = await addDoc(collection(db, "products"), productWithMeta);

    return NextResponse.json({
      id: docRef.id,
      ...productWithMeta,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
