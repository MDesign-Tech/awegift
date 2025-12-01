import { NextRequest, NextResponse } from "next/server";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");

    const quotesRef = collection(db, "quotes");
    let q;

    if (statusFilter) {
      q = query(quotesRef, where("status", "==", statusFilter), orderBy("createdAt", "desc"));
    } else {
      q = query(quotesRef, orderBy("createdAt", "desc"));
    }

    const querySnapshot = await getDocs(q);

    const quotes = querySnapshot.docs.map(doc => ({
      firestoreId: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(
      { quotes },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching quotes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function POST() {
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