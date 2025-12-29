// src/app/api/admin/products/add/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, setDoc, doc } from "firebase/firestore";
import { ProductType } from "../../../../../../type";
import { hasPermission, UserRole } from "@/lib/rbac/roles";
import { getToken } from "next-auth/jwt";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions
    const userRole = token.role as UserRole;
    if (!hasPermission(userRole, "canCreateProducts")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const productData: Omit<ProductType, 'meta'> = await request.json();

    // Trim id if provided
    if (productData.id) {
      productData.id = productData.id.trim();
    }

    // Validate id if provided
    if (productData.id && (typeof productData.id !== 'string' || productData.id === '')) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    // Validate required fields
    if (!productData.title || !productData.price || !productData.categories || !Array.isArray(productData.categories) || productData.categories.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Add timestamps
    const now = new Date().toISOString();
    const productWithMeta: ProductType = {
      ...productData,
      colors: productData.colors || [], // start with admin provided colors
      isActive: productData.isActive !== undefined ? productData.isActive : true, // default active
      isFeatured: productData.isFeatured !== undefined ? productData.isFeatured : false, // default not featured
      meta: {
        createdAt: now,
        updatedAt: now,
        barcode: "",
        qrCode: "",
      },
      id: "", // Use provided id or empty for generation
    };

    // Extract colors using Imagga API if images exist
    if (productWithMeta.images.length > 0) {
      const colorsSet = new Set<string>();

      for (const imageUrl of productWithMeta.images) {
        try {
          const response = await fetch(`https://api.imagga.com/v2/colors?image_url=${encodeURIComponent(imageUrl)}`, {
            headers: {
              Authorization: `Basic ${Buffer.from(`${process.env.IMAGGA_API_KEY}:${process.env.IMAGGA_API_SECRET}`).toString("base64")}`,
            },
          });

          const data = await response.json();

          if (data.result && data.result.colors && data.result.colors.image_colors) {
            // Take top color by percent
            const topColor = data.result.colors.image_colors[0];
            if (topColor && topColor.closest_palette_color) {
              colorsSet.add(topColor.closest_palette_color.toLowerCase());
            }
          }
        } catch (err) {
          console.error("Imagga color extraction failed for image:", imageUrl, err);
        }
      }

      productWithMeta.colors = Array.from(colorsSet);
      // Merge top colors into tags
      productWithMeta.tags = [...new Set([...(productWithMeta.tags || []), ...productWithMeta.colors])];
    }

    // Save to Firestore (exclude id from stored data)
    const { id, ...dataToStore } = productWithMeta;
    let docRef;
    if (id) {
      // Use provided id
      await setDoc(doc(db, "products", id), dataToStore);
      docRef = { id };
    } else {
      // Generate id
      docRef = await addDoc(collection(db, "products"), dataToStore);
      productWithMeta.id = docRef.id;
    }

    // Return saved product with ID
    return NextResponse.json(productWithMeta);

  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
