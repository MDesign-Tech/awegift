import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { hasPermission, UserRole } from "@/lib/rbac/roles";
import { getToken } from "next-auth/jwt";

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication and permissions
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = token.role as UserRole;
    if (!hasPermission(userRole, "canDeleteUsers")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { userIds } = await request.json();

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: "User IDs array required" }, { status: 400 });
    }

    // Check for admin users and prevent their deletion
    const adminUserIds: string[] = [];
    for (const userId of userIds) {
      const userSnapshot = await adminDb.collection("users").doc(userId).get();
      if (userSnapshot.exists) {
        const userData = userSnapshot.data();
        if (userData?.role === "admin") {
          adminUserIds.push(userId);
        }
      }
    }

    if (adminUserIds.length > 0) {
      return NextResponse.json({
        error: `Cannot delete admin users: ${adminUserIds.join(", ")}`
      }, { status: 403 });
    }

    const batch = adminDb.batch();
    userIds.forEach((userId: string) => {
      const userRef = adminDb.collection("users").doc(userId);
      batch.delete(userRef);
    });

    await batch.commit();

    return NextResponse.json({
      message: "Users deleted successfully",
      deletedCount: userIds.length
    });
  } catch (error) {
    console.error("Error deleting selected users:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
