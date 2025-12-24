import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireRole } from "@/lib/server/auth-utils";
import { createQuotationSentNotification } from "@/lib/notification/helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const check = await requireRole(request, "canManageQuotes");
    if (check instanceof NextResponse) return check;

    const { id } = await params;

    const quoteRef = adminDb.collection("quotes").doc(id);
    const quoteDoc = await quoteRef.get();

    if (!quoteDoc.exists) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    const quote = { id: quoteDoc.id, ...quoteDoc.data() };

    return NextResponse.json(quote);
  } catch (error) {
    console.error("Error fetching quote:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const check = await requireRole(request, "canManageQuotes");
    if (check instanceof NextResponse) return check;

    const { id } = await params;
    const updateData = await request.json();

    const quoteRef = adminDb.collection("quotes").doc(id);
    const quoteDoc = await quoteRef.get();

    if (!quoteDoc.exists) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    const existingQuote = quoteDoc.data();

    await quoteRef.update({
      ...updateData,
      updatedAt: new Date(),
    });

    // Send notification if subtotal or finalAmount updated
    if (process.env.NODE_ENV === "production" &&
        (updateData.subtotal !== undefined || updateData.finalAmount !== undefined)) {
      try {
        const customerEmail = existingQuote?.email;
        const customerName = existingQuote?.customerName || "Customer";

        if (customerEmail) {
          createQuotationSentNotification(
            existingQuote.userId,
            customerEmail,
            customerName,
            id,
            updateData.finalAmount ?? existingQuote.finalAmount ?? 0,
            "RWF"
          ).catch((err) => console.error("Failed to create notification:", err));
        }
      } catch (err) {
        console.error("Error sending quotation notification:", err);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating quote:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const check = await requireRole(request, "canManageQuotes");
    if (check instanceof NextResponse) return check;

    const { id } = await params;

    const quoteRef = adminDb.collection("quotes").doc(id);
    const quoteDoc = await quoteRef.get();

    if (!quoteDoc.exists) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    await quoteRef.delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting quote:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
