import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getServerSession } from "next-auth"; import { authOptions } from "@/lib/auth";
import { hasPermission, UserRole } from "@/lib/rbac/roles";
import { fetchUserFromFirestore } from "@/lib/firebase/adminUser";

export async function DELETE(request: NextRequest) {
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
    if (!userRole || !hasPermission(userRole, "canDeleteProducts")) {
      return NextResponse.json(
        { error: "Forbidden - Insufficient permissions" },
        { status: 403 }
      );
    }
    let categoryIds: string[] | undefined;

    // Check if request has a body
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 0) {
      const body = await request.json();
      categoryIds = body.categoryIds;
    }

    const batch = adminDb.batch();

    if (categoryIds && categoryIds.length > 0) {
      // Delete selected categories
      categoryIds.forEach((id) => {
        const docRef = adminDb.collection("categories").doc(id);
        batch.delete(docRef);
      });

      await batch.commit();

      return NextResponse.json({
        message: `Successfully deleted ${categoryIds.length} categories`,
        deletedCount: categoryIds.length
      });
    } else {
      // Delete all categories
      const snapshot = await adminDb.collection("categories").get();

      if (snapshot.empty) {
        return NextResponse.json({ message: "No categories to delete", deletedCount: 0 });
      }

      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      return NextResponse.json({
        message: "All categories deleted successfully",
        deletedCount: snapshot.docs.length
      });
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
