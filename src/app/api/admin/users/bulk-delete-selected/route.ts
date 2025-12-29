import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { hasPermission } from "@/lib/rbac/roles";
import { requireRole } from "@/lib/server/auth-utils";

export async function DELETE(request: NextRequest) {
  try {
    // ✅ Check authentication and permission
    const check = await requireRole(request, "canDeleteUsers");
    if (check instanceof NextResponse) return check;

    // request body
    const { userIds } = await request.json();
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: "User IDs array required" }, { status: 400 });
    }

    // 🔐 Prevent deletion of admin users
    const adminUserIds: string[] = [];
    const batch = adminDb.batch();

    for (const userId of userIds) {
      const userDoc = await adminDb.collection("users").doc(userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        if (userData?.role === "admin") {
          adminUserIds.push(userId);
          continue; // skip admins
        }
        batch.delete(adminDb.collection("users").doc(userId));
      }
    }

    if (adminUserIds.length > 0) {
      return NextResponse.json({
        error: `Cannot delete admin users: ${adminUserIds.join(", ")}`,
      }, { status: 403 });
    }

    // commit batch
    await batch.commit();

    return NextResponse.json({
      message: "Users deleted successfully",
      deletedCount: userIds.length - adminUserIds.length,
    });
  } catch (error) {
    console.error("Error deleting selected users:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
