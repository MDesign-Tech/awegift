import { NextRequest, NextResponse } from "next/server";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { auth } from "../../../../auth";

interface Product {
  name: string;
  quantity: number;
}

interface QuoteRequest {
  products: Product[];
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body: QuoteRequest = await request.json();
    const { products, message } = body;

    // Validation
    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: "Please provide at least one product" }, { status: 400 });
    }

    const invalidProduct = products.find((p) => !p.name || !String(p.name).trim() || !p.quantity || p.quantity <= 0);
    if (invalidProduct) {
      return NextResponse.json({ error: "Each product must have a name and a valid quantity" }, { status: 400 });
    }

    if (!message || !String(message).trim()) {
      return NextResponse.json({ error: "Please provide a message or project details" }, { status: 400 });
    }

    // Generate unique ID
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const id = `QUOTE-${timestamp}-${randomSuffix}`;

    // Create quote document in Firestore
    const quoteDoc = await addDoc(collection(db, "quotes"), {
      id,
      products: products.map((p) => ({ name: String(p.name).trim(), quantity: Number(p.quantity) })),
      message: String(message).trim(),
      status: "pending",
      adminResponse: null,
      notified: false,
      requesterId: session?.user?.id || null,
      email: session?.user?.email || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json({ message: "Quote request submitted successfully", quoteId: id, firestoreId: quoteDoc.id }, { status: 201 });
  } catch (error) {
    console.error("Error creating quote:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}