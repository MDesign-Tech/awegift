import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getToken } from "next-auth/jwt";
import { hasPermission, UserRole } from "@/lib/rbac/roles";

export async function DELETE(request: NextRequest) {
  try {
    const token = await getToken({ req: request });

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized - No session found" },
        { status: 401 }
      );
    }

    const userRole = token.role as UserRole;
    if (!userRole || !hasPermission(userRole, "canManageQuotes")) {
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
    console.error("Error deleting quotes:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}