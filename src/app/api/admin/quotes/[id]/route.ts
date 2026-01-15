import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import admin from "firebase-admin";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission, UserRole } from "@/lib/rbac/roles";
import { createQuotationSentNotification } from "@/lib/notification/helpers";
import { QUOTE_STATUSES } from "@/lib/quoteStatuses";
import { fetchUserFromFirestore } from "@/lib/firebase/adminUser";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - No session found" },
        { status: 401 }
      );
    }

    // Fetch user role
        const user = await fetchUserFromFirestore(session.user.id);
        if (!user) {
            return NextResponse.json(
              { error: "User deleted", code: "USER_DELETED" },
              { status: 401 }
            );
        }

    const userRole = session.user.role as UserRole;
    if (!userRole || !hasPermission(userRole, "canUpdateQuotes")) {
      return NextResponse.json(
        { error: "Forbidden - Insufficient permissions" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const quoteRef = adminDb.collection("quotes").doc(id);
    const quoteDoc = await quoteRef.get();

    if (!quoteDoc.exists) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    const data = quoteDoc.data();
    const quote = {
      id: quoteDoc.id,
      ...data,
      createdAt: data?.createdAt?.toDate?.()?.toISOString() || data?.createdAt,
      updatedAt: data?.updatedAt?.toDate?.()?.toISOString() || data?.updatedAt,
      expirationDate: data?.expirationDate?.toDate?.()?.toISOString() || (data?.expirationDate ? new Date(data.expirationDate).toISOString() : null),
      validUntil: data?.validUntil?.toDate?.()?.toISOString() || (data?.validUntil ? new Date(data.validUntil).toISOString() : null),
    };

    return NextResponse.json(quote);
  } catch (error) {
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
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - No session found" },
        { status: 401 }
      );
    }

    // Fetch user role
    const user = await fetchUserFromFirestore(session.user.id);
    if (!user) {
        return NextResponse.json(
          { error: "User deleted", code: "USER_DELETED" },
          { status: 401 }
        );
    }

    const userRole = session.user.role as UserRole;
    if (!userRole || !hasPermission(userRole, "canViewQuotes")) {
      return NextResponse.json(
        { error: "Forbidden - Insufficient permissions" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const updateData = await request.json();

    const quoteRef = adminDb.collection("quotes").doc(id);
    const quoteDoc = await quoteRef.get();

    if (!quoteDoc.exists) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    const existingQuote = quoteDoc.data();

    // If admin is updating pricing info, change status to responded
    const statusUpdate: any = {};
    if (updateData.subtotal !== undefined || updateData.finalAmount !== undefined || updateData.discount !== undefined || updateData.deliveryFee !== undefined) {
      statusUpdate.status = QUOTE_STATUSES.RESPONDED;
    }

    await quoteRef.update({
      ...updateData,
      ...statusUpdate,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
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
            "RWF",
            existingQuote
          ).catch((err) => console.error("Failed to create notification:", err));
        }
      } catch (err) {
        // Error sending notification
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
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
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - No session found" },
        { status: 401 }
      );
    }

    // Fetch user role
    const user = await fetchUserFromFirestore(session.user.id);
    if (!user) {
        return NextResponse.json(
          { error: "User deleted", code: "USER_DELETED" },
          { status: 401 }
        );
    }

    const userRole = session.user.role as UserRole;
    if (!userRole || !hasPermission(userRole, "canDeleteQuotes")) {
      return NextResponse.json(
        { error: "Forbidden - Insufficient permissions" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const quoteRef = adminDb.collection("quotes").doc(id);
    const quoteDoc = await quoteRef.get();

    if (!quoteDoc.exists) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    await quoteRef.delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
