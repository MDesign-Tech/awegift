import{ NextRequest, NextResponse } from "next/server";
import { QuotationType, QuotationProductType } from "../../../../type";
import { QUOTE_STATUSES } from "@/lib/quoteStatuses";
import { adminDb } from "@/lib/firebase/admin";
import admin from "firebase-admin";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchUserFromFirestore } from "@/lib/firebase/adminUser";
import { createQuotationRequestNotification } from "@/lib/notification/helpers";

// POST - Create new quote request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    let user = null;

    // If user is logged in, fetch their data
    if (session?.user?.email) {
      user = await fetchUserFromFirestore(session.user.id);
      if (!user) {
          return NextResponse.json(
            { error: "User deleted", code: "USER_DELETED" },
            { status: 401 }
          );
      }
    }

    const { products, userNotes, email, phone }: {
      products: QuotationProductType[];
      userNotes: string;
      email?: string;
      phone?: string;
    } = await request.json();

    // Validate input
    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: "At least one product is required" }, { status: 400 });
    }

    // Ensure valid quantities (minimum 1)
    const validatedProducts = products.map(product => ({
      ...product,
      quantity: Math.max(1, product.quantity || 1)
    }));

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
    const newQuote: QuotationType = {
      id: quoteId,
      userId: user?.id || `guest_${Date.now()}`, // Use guest ID for non-logged-in users
      email: user?.email || email!,
      phone: user?.profile?.phone || phone || null,
      products: validatedProducts,
      subtotal,
      discount,
      deliveryFee,
      finalAmount,
      status: QUOTE_STATUSES.PENDING,
      userNotes,
      expirationDate: expirationDate.toISOString(),
      validUntil: validUntil.toISOString(),
      notified: false,
      viewed: false,
      createdAt: new Date().toISOString(), // Will be overridden by server timestamp
      updatedAt: new Date().toISOString(), // Will be overridden by server timestamp
    };

    // Add to quotes collection with custom ID
    await adminDb.collection("quotes").doc(quoteId).set({
      ...newQuote,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Send notification to admin about new quotation request
    if (process.env.NODE_ENV === 'production') {
      try {
        createQuotationRequestNotification(
          'admin', // Admin user ID - should be configurable
          quoteId,
          user?.email || email!,
          newQuote
        ).catch(error => {
          console.error('Failed to create quotation request notification:', error);
        });
      } catch (error) {
        console.error('Error sending quotation request notification:', error);
      }
    }

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
