import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { adminDb } from "@/lib/firebase/admin";
import { signOut } from "next-auth/react";

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get user data
    const userDoc = await adminDb.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();

    // Start a batch operation for atomic deletion
    const batch = adminDb.batch();

    // Delete user document
    batch.delete(userDoc.ref);

    // Delete user's orders
    const ordersSnapshot = await adminDb
      .collection("orders")
      .where("userId", "==", userId)
      .get();
    ordersSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Delete user's quotes
    const quotesSnapshot = await adminDb
      .collection("quotations")
      .where("userId", "==", userId)
      .get();
    quotesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Delete user's notifications
    const notificationsSnapshot = await adminDb
      .collection("notifications")
      .where("recipientId", "==", userId)
      .get();
    notificationsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Commit the batch
    await batch.commit();

    // Note: We can't call signOut here as this is server-side
    // The client should handle sign out after successful deletion

    return NextResponse.json({
      message: "Account deleted successfully"
    });
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
