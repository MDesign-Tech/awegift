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
    if (!userRole || !hasPermission(userRole, "canDeleteQuotes")) {
      return NextResponse.json(
        { error: "Forbidden - Insufficient permissions" },
        { status: 403 }
      );
    }

    let quoteIds: string[] | undefined;

    // Check if request has a body
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 0) {
      const body = await request.json();
      quoteIds = body.quoteIds;
    }

    const batch = adminDb.batch();

    if (quoteIds && quoteIds.length > 0) {
      // Delete selected quotes
      quoteIds.forEach((id) => {
        const docRef = adminDb.collection("quotes").doc(id);
        batch.delete(docRef);
      });

      await batch.commit();

      return NextResponse.json({
        message: `Successfully deleted ${quoteIds.length} quotes`,
        deletedCount: quoteIds.length
      });
    } else {
      // Delete all quotes
      const snapshot = await adminDb.collection("quotes").get();

      if (snapshot.empty) {
        return NextResponse.json({ message: "No quotes to delete", deletedCount: 0 });
      }

      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      return NextResponse.json({
        message: "All quotes deleted successfully",
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
