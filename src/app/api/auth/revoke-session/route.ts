import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { adminDb } from "@/lib/firebase/admin";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { sessionId } = await request.json();
    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Get user data
    const userDoc = await adminDb.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const loginSessions = userData?.loginSessions || [];

    // Find the session
    const sessionIndex = loginSessions.findIndex((s: any) => s.id === sessionId);
    if (sessionIndex === -1) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Check if it's the current session
    const currentSessionId = (session as any).sessionId;
    if (sessionId === currentSessionId) {
      return NextResponse.json(
        { error: "Cannot revoke current session" },
        { status: 400 }
      );
    }

    // Revoke the session
    loginSessions[sessionIndex].revoked = true;
    loginSessions[sessionIndex].revokedAt = new Date().toISOString();

    await userDoc.ref.update({
      loginSessions,
    });

    return NextResponse.json({
      message: "Session revoked successfully"
    });
  } catch (error) {
    console.error("Revoke session error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}