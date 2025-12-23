import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { hasPermission, UserRole } from "@/lib/rbac/roles";
import { getToken } from "next-auth/jwt";
import { emailService } from "@/lib/email/service";
import { createQuotationSentNotification } from "@/lib/notification/helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Check authentication and permissions
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = token.role as UserRole;
    if (!hasPermission(userRole, "canManageQuotes")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const quoteRef = adminDb.collection("quotes").doc(id);
    const quoteDoc = await quoteRef.get();

    if (!quoteDoc.exists) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    const quote = {
      id: quoteDoc.id,
      ...quoteDoc.data(),
    };

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
    const { id } = await params;
    // Check authentication and permissions
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = token.role as UserRole;
    if (!hasPermission(userRole, "canManageQuotes")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const updateData = await request.json();

    const quoteRef = adminDb.collection("quotes").doc(id);
    const quoteDoc = await quoteRef.get();

    if (!quoteDoc.exists) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    // Get the existing quote to check for changes
    const existingQuote = quoteDoc.data();
    
    await quoteRef.update({
      ...updateData,
      updatedAt: new Date(),
    });

    // Send notification if admin provided a response (subtotal or finalAmount updated)
    if (process.env.NODE_ENV === 'production' &&
        (updateData.subtotal !== undefined || updateData.finalAmount !== undefined)) {
      try {
        const customerEmail = existingQuote?.email;
        const customerName = existingQuote?.customerName || 'Customer';
        
        if (customerEmail) {
          createQuotationSentNotification(
            existingQuote.userId,
            customerEmail,
            customerName,
            id,
            updateData.finalAmount || existingQuote.finalAmount || 0,
            'RWF'
          ).catch((error: any) => {
            console.error('Failed to create quotation sent notification:', error);
          });
        }
      } catch (error) {
        console.error('Error sending quotation response notification:', error);
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
    const { id } = await params;
    // Check authentication and permissions
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = token.role as UserRole;
    if (!hasPermission(userRole, "canManageQuotes")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

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
