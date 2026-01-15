import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(request: NextRequest) {
  try {
    // Fetch all products
    const snapshot = await adminDb.collection("products").get();
    const products = snapshot.docs.map(doc => doc.data());

    // Extract all images from all products
    const allImages: string[] = [];
    products.forEach(product => {
      if (product.images && Array.isArray(product.images)) {
        allImages.push(...product.images);
      }
    });

    return NextResponse.json({
      images: allImages
    });
  } catch (error) {
    console.error("Error fetching gallery images:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
