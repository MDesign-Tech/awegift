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

    const { quoteIds } = await request.json();

    if (!quoteIds || !Array.isArray(quoteIds) || quoteIds.length === 0) {
      return NextResponse.json(
        { error: "Quote IDs array is required" },
        { status: 400 }
      );
    }

    const results = {
      deleted: [] as string[],
      notFound: [] as string[],
      errors: [] as { quoteId: string; error: string }[],
    };

    for (const quoteId of quoteIds) {
      try {
        const quoteRef = adminDb.collection("quotes").doc(quoteId);
        const quoteDoc = await quoteRef.get();

        if (quoteDoc.exists) {
          await quoteRef.delete();
          results.deleted.push(quoteId);
        } else {
          results.notFound.push(quoteId);
        }
      } catch (error) {
        console.error(`Error deleting quote ${quoteId}:`, error);
        results.errors.push({
          quoteId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Deleted ${results.deleted.length} quotes successfully`,
      results,
    });
  } catch (error) {
    console.error("Error in bulk delete selected quotes:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}