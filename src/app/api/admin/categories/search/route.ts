import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { CategoryType } from "../../../../../../type";
import { requireRole } from "@/lib/server/auth-utils";

export async function GET(request: NextRequest) {
  try {
    const check = await requireRole(request, "canViewProducts");
    if (check instanceof NextResponse) return check;

    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get('q') || '';
    const limitParam = parseInt(searchParams.get('limit') || '10');

    if (!searchQuery.trim()) {
      return NextResponse.json({ categories: [] });
    }

    // Fetch all categories and filter client-side for simplicity
    // In production, you might want to use Firestore queries for better performance
    const snapshot = await adminDb.collection("categories").get();

    const allCategories = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as (CategoryType & { id: string })[];

    // Filter categories based on search query
    const filteredCategories = allCategories.filter(category =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.slug.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, limitParam);

    return NextResponse.json({ categories: filteredCategories });
  } catch (error) {
    console.error("Error searching categories:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
