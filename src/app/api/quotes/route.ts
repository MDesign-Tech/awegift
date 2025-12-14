import{ NextRequest, NextResponse } from "next/server";
import { QuoteType, QuoteProductType } from "../../../../type";
import { QUOTE_STATUSES } from "@/lib/quoteStatuses";
import { db } from "@/lib/firebase/config";
import {
  collection,
  addDoc,
  updateDoc,
  setDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { auth } from "../../../../auth";
import { fetchUserFromFirestore } from "@/lib/firebase/userService";

// POST - Create new quote request
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    let user = null;

    // If user is logged in, fetch their data
    if (session?.user?.email) {
      user = await fetchUserFromFirestore(session.user.id);
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
    }

    const { products, userNotes, email, phone }: {
      products: QuoteProductType[];
      userNotes: string;
      email?: string;
      phone?: string;
    } = await request.json();

    // Validate input
    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: "At least one product is required" }, { status: 400 });
    }

    // For non-logged-in users, validate email
    if (!session?.user?.email) {
      if (!email?.trim()) {
        return NextResponse.json({ error: "Email is required" }, { status: 400 });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
      }
    }

    // Calculate totals
    const subtotal = 0; // Will be calculated by admin later
    const discount = 0;
    const deliveryFee = 0;
    const finalAmount = 0;

    // Generate custom quote ID
    const generateQuoteId = (): string => {
      const year = new Date().getFullYear();
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `QT-${year}-${timestamp.toString().slice(-4)}${random}`;
    };

    const quoteId = generateQuoteId();

    // Create expiration date (30 days from now)
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 30);

    const validUntil = new Date(expirationDate);

    // Create new quote
    const newQuote: QuoteType = {
      id: quoteId,
      userId: user?.id || `guest_${Date.now()}`, // Use guest ID for non-logged-in users
      email: user?.email || email!,
      phone: user?.profile?.phone || phone || null,
      products,
      subtotal,
      discount,
      deliveryFee,
      finalAmount,
      status: QUOTE_STATUSES.PENDING,
      messages: [],
      userNotes,
      expirationDate,
      validUntil,
      notified: false,
      viewed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add to quotes collection with custom ID
    await setDoc(doc(db, "quotes", quoteId), {
      ...newQuote,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      id: quoteId,
      message: "Quote request submitted successfully",
    });
  } catch (error) {
    console.error("Error creating quote:", error);
    return NextResponse.json(
      { error: "Failed to create quote request" },
      { status: 500 }
    );
  }
}