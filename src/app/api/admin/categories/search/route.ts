import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { CategoryType } from "../../../../../../type";
import { getServerSession } from "next-auth"; import { authOptions } from "@/lib/auth";
import { hasPermission, UserRole } from "@/lib/rbac/roles";
import { fetchUserFromFirestore } from "@/lib/firebase/adminUser";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - No session found" },
        { status: 401 }
      );
    }

    const userRole = session.user.role as UserRole;
    if (!userRole || !hasPermission(userRole, "canViewProducts")) {
      return NextResponse.json(
        { error: "Forbidden - Insufficient permissions" },
        { status: 403 }
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
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
