import { NextRequest, NextResponse } from "next/server";
import { QuoteType } from "../../../../../../type";
import { db } from "@/lib/firebase/config";
import {
  doc,
  getDoc,
} from "firebase/firestore";
import { auth } from "../../../../../../auth";
import { fetchUserFromFirestore } from "@/lib/firebase/userService";

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
    const quoteDoc = await getDoc(doc(db, "quotes", quoteId));

    if (!quoteDoc.exists()) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    const quoteData = quoteDoc.data();

    // Check if the quote belongs to the current user
    if (quoteData.userId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Convert Firestore timestamps to Date objects
    const quote: QuoteType = {
      id: quoteDoc.id,
      ...quoteData,
      createdAt: quoteData.createdAt?.toDate?.() || new Date(quoteData.createdAt),
      updatedAt: quoteData.updatedAt?.toDate?.() || new Date(quoteData.updatedAt),
      expirationDate: quoteData.expirationDate?.toDate?.() || new Date(quoteData.expirationDate),
      validUntil: quoteData.validUntil?.toDate?.() || new Date(quoteData.validUntil),
    } as QuoteType;

    return NextResponse.json({ quote });
  } catch (error) {
    console.error("Error fetching quote:", error);
    return NextResponse.json(
      { error: "Failed to fetch quote" },
      { status: 500 }
    );
  }
}