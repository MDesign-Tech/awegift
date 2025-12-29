import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireRole } from "@/lib/server/auth-utils";

export async function DELETE(request: NextRequest) {
  try {
    // ✅ Check authentication & permission
    const check = await requireRole(request, "canDeleteUsers");
    if (check instanceof NextResponse) return check;

    // Get request body
    const { userIds } = await request.json();
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: "Invalid user IDs provided" },
        { status: 400 }
      );
    }

    // 🔐 Optional: Prevent admin deletion
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

    // Commit batch
    await batch.commit();

    return NextResponse.json({
      message: `Successfully deleted ${userIds.length - adminUserIds.length} users`,
    });
  } catch (error) {
    console.error("Error deleting users:", error);
    return NextResponse.json(
      { error: "Failed to delete users" },
      { status: 500 }
    );
  }
}
