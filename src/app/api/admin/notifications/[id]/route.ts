import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../../auth";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.role || !["admin"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const notificationId = params.id;

    if (!notificationId) {
      return NextResponse.json(
        { error: "Notification ID is required" },
        { status: 400 }
      );
    }

    // Delete the notification
    const notificationRef = doc(db, "notifications", notificationId);
    await deleteDoc(notificationRef);

    return NextResponse.json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}