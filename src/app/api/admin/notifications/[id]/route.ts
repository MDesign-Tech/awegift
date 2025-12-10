import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { hasPermission, UserRole } from "@/lib/rbac/roles";
import { getToken } from "next-auth/jwt";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and permissions
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = token.role as UserRole;
    if (!hasPermission(userRole, "canViewUsers")) { // Admin can manage notifications
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const notificationId = params.id;
    const notificationRef = doc(db, "notifications", notificationId);
    const notificationDoc = await getDoc(notificationRef);

    if (!notificationDoc.exists()) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    await deleteDoc(notificationRef);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}