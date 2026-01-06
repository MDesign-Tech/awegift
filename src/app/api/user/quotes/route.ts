import { NextRequest, NextResponse } from "next/server";
import { QuotationType } from "../../../../../type";
import { adminDb } from "@/lib/firebase/admin";
import { Timestamp } from "firebase/firestore";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET - Fetch user's quotes
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch quotes by email
    const quotesSnapshot = await adminDb.collection("quotes").where("email", "==", session.user.email).get();

    const quotes = quotesSnapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
          expirationDate: data.expirationDate?.toDate?.() || new Date(data.expirationDate),
          validUntil: data.validUntil?.toDate?.() || new Date(data.validUntil),
        } as QuotationType;
      })
      .sort((a, b) => {
        const getTime = (date: Date | Timestamp) => {
          if (date instanceof Date) return date.getTime();
          if (typeof date === 'object' && 'toDate' in date) return date.toDate().getTime();
          return new Date(date as any).getTime();
        };
        return getTime(b.createdAt) - getTime(a.createdAt);
      }); // Sort by createdAt desc

    return NextResponse.json({ quotes });
  } catch (error) {
    console.error("Error fetching quotes:", error);
    return NextResponse.json(
      { error: "Failed to fetch quotes" },
      { status: 500 }
    );
  }
}