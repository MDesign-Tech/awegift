import { NextRequest, NextResponse } from "next/server";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

interface QuoteRequest {
  fullName: string;
  email: string;
  phone: string;
  reason: string;
}

export async function POST(request: NextRequest) {
  try {
    const { fullName, email, phone, reason }: QuoteRequest = await request.json();

    // Validation
    if (!fullName || !email || !phone || !reason) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    // Phone validation (basic)
    if (!/^\+?[\d\s\-\(\)]+$/.test(phone) || phone.length < 7) {
      return NextResponse.json(
        { error: "Please provide a valid phone number" },
        { status: 400 }
      );
    }

    // Generate unique ID
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const id = `QUOTE-${timestamp}-${randomSuffix}`;

    // Create quote document in Firestore
    const quoteDoc = await addDoc(collection(db, "quotes"), {
      id,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      reason: reason.trim(),
      status: "pending",
      adminResponse: null,
      notified: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json(
      {
        message: "Quote request submitted successfully",
        quoteId: id,
        firestoreId: quoteDoc.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating quote:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}