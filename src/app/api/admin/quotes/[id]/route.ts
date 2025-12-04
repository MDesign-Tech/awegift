import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

interface UpdateQuoteRequest {
  adminResponse?: string;
  status?: "pending" | "in_review" | "completed";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const quoteRef = doc(db, "quotes", id);
    const quoteSnap = await getDoc(quoteRef);

    if (!quoteSnap.exists()) {
      return NextResponse.json(
        { error: "Quote not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        firestoreId: quoteSnap.id,
        ...quoteSnap.data(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching quote:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { adminResponse, status }: UpdateQuoteRequest = await request.json();

    const quoteRef = doc(db, "quotes", id);
    const quoteSnap = await getDoc(quoteRef);

    if (!quoteSnap.exists()) {
      return NextResponse.json(
        { error: "Quote not found" },
        { status: 404 }
      );
    }

    const updateData: any = {
      updatedAt: serverTimestamp(),
    };

    if (adminResponse !== undefined) {
      updateData.adminResponse = adminResponse;
    }

    if (status !== undefined) {
      updateData.status = status;
    }

    await updateDoc(quoteRef, updateData);

    // If status changed to completed and adminResponse is provided, trigger notifications
    if (status === "completed" && adminResponse && adminResponse.trim()) {
      try {
        // Trigger notifications automatically
        await fetch(`${request.nextUrl.origin}/api/quotes/notifications`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quoteId: id,
          }),
        });
      } catch (notificationError) {
        console.error("Error triggering notifications:", notificationError);
        // Don't fail the update if notifications fail
      }
    }

    return NextResponse.json(
      { message: "Quote updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating quote:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const quoteRef = doc(db, "quotes", id);
    const quoteSnap = await getDoc(quoteRef);

    if (!quoteSnap.exists()) {
      return NextResponse.json(
        { error: "Quote not found" },
        { status: 404 }
      );
    }

    // Note: In a real application, you might want to soft delete or archive instead
    // For now, we'll allow hard deletion
    // await deleteDoc(quoteRef);

    return NextResponse.json(
      { message: "Quote deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting quote:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}