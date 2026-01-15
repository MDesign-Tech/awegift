import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { hasPermission, UserRole } from "@/lib/rbac/roles";
import { getServerSession } from "next-auth"; import { authOptions } from "@/lib/auth";
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
      if (!userRole || !hasPermission(userRole, "canViewAnalytics")) {
        return NextResponse.json(
          { error: "Forbidden - Insufficient permissions" },
          { status: 403 }
        );
      }
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

        // Delete all orders for this user
        const ordersSnapshot = await adminDb.collection("orders").where("userId", "==", userId).get();
        ordersSnapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });

        // Delete all quotes for this user
        const quotesSnapshot = await adminDb.collection("quotes").where("userId", "==", userId).get();
        quotesSnapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });

        // Delete all notifications for this user
        const notificationsSnapshot = await adminDb.collection("notifications").where("recipientId", "==", userId).get();
        notificationsSnapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });

        // Delete verification tokens for this user (if any)
        const verificationTokensSnapshot = await adminDb.collection("verificationTokens").where("userId", "==", userId).get();
        verificationTokensSnapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });

        // Delete password reset tokens for this user (if any)
        const passwordResetTokensSnapshot = await adminDb.collection("passwordResetTokens").where("userId", "==", userId).get();
        passwordResetTokensSnapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
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
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
