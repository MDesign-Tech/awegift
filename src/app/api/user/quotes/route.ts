import { NextRequest, NextResponse } from "next/server";
import { QuotationType } from "../../../../../type";
import { adminDb } from "@/lib/firebase/admin";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchUserFromFirestore } from "@/lib/firebase/adminUser";

// GET - Fetch user's quotes
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

     // Fetch user role
        const user = await fetchUserFromFirestore(session.user.id);
        if (!user) {
            return NextResponse.json(
              { error: "User deleted", code: "USER_DELETED" },
              { status: 401 }
            );
        }

    // Fetch quotes by email
    const quotesSnapshot = await adminDb.collection("quotes").where("email", "==", session.user.email).get();

    const quotes = quotesSnapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
          expirationDate: data.expirationDate?.toDate?.() || new Date(data.expirationDate),
          validUntil: data.validUntil?.toDate?.() || new Date(data.validUntil),
        } as QuotationType;
      })
      .sort((a, b) => {
        const getTime = (date: string) => new Date(date).getTime();
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
