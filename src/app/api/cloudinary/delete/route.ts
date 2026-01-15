import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinaryConfig";

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { public_id } = body;

    if (!public_id) {
      return NextResponse.json(
        { error: "Public ID is required" },
        { status: 400 }
      );
    }

    // Call Cloudinary destruction
    const result = await cloudinary.uploader.destroy(public_id, { invalidate: true });

    // Cloudinary returns: { result: "ok" } OR "not found"
    if (result.result === "ok" || result.result === "not found") {
      return NextResponse.json({
        success: true,
        message: "Image deleted successfully",
        result,
      });
    }

    return NextResponse.json(
      { error: "Failed to delete image", result },
      { status: 500 }
    );
  } catch (error) {
    console.error("Cloudinary delete error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
