import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { hasPermission, UserRole } from "@/lib/rbac/roles";
import { getToken } from "next-auth/jwt";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and permissions
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = token.role as UserRole;
    if (!hasPermission(userRole, "canManageQuotes")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const quoteId = params.id;
    const updateData = await request.json();

    const quoteRef = doc(db, "quotes", quoteId);
    const quoteDoc = await getDoc(quoteRef);

    if (!quoteDoc.exists()) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    await updateDoc(quoteRef, {
      ...updateData,
      updatedAt: new Date(),
    });

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
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and permissions
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = token.role as UserRole;
    if (!hasPermission(userRole, "canManageQuotes")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const quoteId = params.id;
    const quoteRef = doc(db, "quotes", quoteId);
    const quoteDoc = await getDoc(quoteRef);

    if (!quoteDoc.exists()) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    await deleteDoc(quoteRef);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting quote:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}