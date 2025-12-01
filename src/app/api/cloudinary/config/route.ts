import { NextRequest, NextResponse } from "next/server";

// Cloudinary configuration endpoint
export async function GET(request: NextRequest) {
  try {
    // Return Cloudinary configuration for client-side uploads
    const config = {
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      uploadPreset: {
        products: "products",
        categories: "categories",
        profiles: "profiles"
      },
      apiKey: process.env.CLOUDINARY_API_KEY,
    };

    return NextResponse.json(config);
  } catch (error) {
    console.error("Error fetching Cloudinary config:", error);
    return NextResponse.json(
      { error: "Failed to fetch Cloudinary configuration" },
      { status: 500 }
    );
  }
}