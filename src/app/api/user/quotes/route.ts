import { NextRequest, NextResponse } from "next/server";
import { QuotationType } from "../../../../../type";
import { adminDb } from "@/lib/firebase/admin";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { fetchUserFromFirestore } from "@/lib/firebase/userService";

// GET - Fetch user's quotes
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user from Firestore
    const user = await fetchUserFromFirestore(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Users can only see their own quotes
    const quotesSnapshot = await adminDb.collection("quotes").where("userId", "==", user.id).get();

    const quotes = quotesSnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(doc.data().updatedAt),
        expirationDate: doc.data().expirationDate?.toDate?.() || new Date(doc.data().expirationDate),
        validUntil: doc.data().validUntil?.toDate?.() || new Date(doc.data().validUntil),
      }) as QuotationType)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Sort by createdAt desc

    return NextResponse.json({ quotes });
  } catch (error) {
    console.error("Error fetching quotes:", error);
    return NextResponse.json(
      { error: "Failed to fetch quotes" },
      { status: 500 }
    );
  }
}