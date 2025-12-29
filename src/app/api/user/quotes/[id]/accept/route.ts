import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { auth } from "@/auth";
import { fetchUserFromFirestore } from "@/lib/firebase/adminUser";
import { QUOTE_STATUSES } from "@/lib/quoteStatuses";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await fetchUserFromFirestore(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id: quoteId } = await params;

    const quoteRef = adminDb.collection("quotes").doc(quoteId);
    const quoteDoc = await quoteRef.get();

    if (!quoteDoc.exists) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    const quoteData = quoteDoc.data()!;

    if (quoteData.email !== user.email) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (quoteData.status !== QUOTE_STATUSES.RESPONDED) {
      return NextResponse.json({ error: "Quote cannot be accepted at this status" }, { status: 400 });
    }

    await quoteRef.update({
      status: QUOTE_STATUSES.ACCEPTED,
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error accepting quote:", error);
    return NextResponse.json(
      { error: "Failed to accept quote" },
      { status: 500 }
    );
  }
}