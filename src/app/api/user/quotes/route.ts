import { NextRequest, NextResponse } from "next/server";
import { QuoteType } from "../../../../../type";
import { db } from "@/lib/firebase/config";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { auth } from "../../../../../auth";
import { fetchUserFromFirestore } from "@/lib/firebase/userService";

// GET - Fetch user's quotes
export async function GET(request: NextRequest) {
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

    // Users can only see their own quotes
    const quotesQuery = query(
      collection(db, "quotes"),
      where("userId", "==", user.id)
    );

    const quotesSnapshot = await getDocs(quotesQuery);

    const quotes = quotesSnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(doc.data().updatedAt),
        expirationDate: doc.data().expirationDate?.toDate?.() || new Date(doc.data().expirationDate),
        validUntil: doc.data().validUntil?.toDate?.() || new Date(doc.data().validUntil),
      }) as QuoteType)
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