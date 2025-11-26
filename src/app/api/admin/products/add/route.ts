import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import { collection, addDoc } from "firebase/firestore";
import { ProductType } from "../../../../../../type";
import { hasPermission, UserRole } from "@/lib/rbac/roles";
import { getToken } from "next-auth/jwt";

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

    const { addDoc } = await import("firebase/firestore");
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