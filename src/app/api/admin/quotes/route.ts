import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireRole } from "@/lib/server/auth-utils";

export async function GET(request: NextRequest) {
  try {
    const check = await requireRole(request, "canManageQuotes");
    if (check instanceof NextResponse) return check;

    const snapshot = await adminDb.collection("quotes").orderBy("createdAt", "desc").limit(5000).get();

    const quotes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ quotes });
  } catch (error) {
    console.error("Error fetching quotes:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}