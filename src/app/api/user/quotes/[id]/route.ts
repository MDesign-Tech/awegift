import { NextRequest, NextResponse } from "next/server";
import { QuotationType } from "../../../../../../type";
import { adminDb } from "@/lib/firebase/admin";
import { auth } from "@/auth";
import { fetchUserFromFirestore } from "@/lib/firebase/adminUser";

// GET - Fetch single quote by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user from Firestore
    const user = await fetchUserFromFirestore(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id: quoteId } = await params;

    // Get the specific quote document
    const quoteDoc = await adminDb.collection("quotes").doc(quoteId).get();

    if (!quoteDoc.exists) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    const quoteData = quoteDoc.data()!;

    // Check if the quote belongs to the current user
    if (quoteData.email !== user.email) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Convert Firestore timestamps to Date objects
    const quote: QuotationType = {
      id: quoteDoc.id,
      ...quoteData,
      createdAt: quoteData.createdAt?.toDate?.() || (quoteData.createdAt ? new Date(quoteData.createdAt) : new Date()),
      updatedAt: quoteData.updatedAt?.toDate?.() || (quoteData.updatedAt ? new Date(quoteData.updatedAt) : new Date()),
      expirationDate: quoteData.expirationDate?.toDate?.() || (quoteData.expirationDate ? new Date(quoteData.expirationDate) : null),
      validUntil: quoteData.validUntil?.toDate?.() || (quoteData.validUntil ? new Date(quoteData.validUntil) : null),
    } as QuotationType;

    return NextResponse.json({ quote });
  } catch (error) {
    console.error("Error fetching quote:", error);
    return NextResponse.json(
      { error: "Failed to fetch quote" },
      { status: 500 }
    );
  }
}