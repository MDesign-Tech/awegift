// src/app/api/admin/products/add/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { ProductType } from "../../../../../../type";
import { getServerSession } from "next-auth"; import { authOptions } from "@/lib/auth";
import { hasPermission, UserRole } from "@/lib/rbac/roles";
import { createNewProductLaunchNotification } from "@/lib/notification/helpers";
import { fetchUserFromFirestore } from "@/lib/firebase/adminUser";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - No session found" },
        { status: 401 }
      );
    }

    // Fetch user role
        const user = await fetchUserFromFirestore(session.user.id);
        if (!user) {
            return NextResponse.json(
              { error: "User deleted", code: "USER_DELETED" },
              { status: 401 }
            );
        }

    const userRole = session.user.role as UserRole;
    if (!userRole || !hasPermission(userRole, "canCreateProducts")) {
      return NextResponse.json(
        { error: "Forbidden - Insufficient permissions" },
        { status: 403 }
      );
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
          // Imagga color extraction failed
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
      await adminDb.collection("products").doc(id).set(dataToStore);
      docRef = { id };
    } else {
      // Generate id
      docRef = await adminDb.collection("products").add(dataToStore);
      productWithMeta.id = docRef.id;
    }

    // Return saved product with ID
    return NextResponse.json(productWithMeta);

  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
