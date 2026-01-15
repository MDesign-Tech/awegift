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

    const snapshot = await adminDb.collection("products").limit(5000).get();

    if (snapshot.empty) {
      return NextResponse.json({ message: "No products to delete", deletedCount: 0 });
    }

    // For admin SDK, delete individually or use batch
    const deletePromises = snapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(deletePromises);

    return NextResponse.json({
      message: "All products deleted successfully",
      deletedCount: snapshot.docs.length
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
