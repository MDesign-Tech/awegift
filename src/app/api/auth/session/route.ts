import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // Ensure user object is serializable
    const user = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
      role: (session.user as any).role,
    };

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Session fetch error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch session" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}