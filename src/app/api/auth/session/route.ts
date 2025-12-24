import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { getCurrentUserData } from "@/lib/firebase/adminUser";

export async function GET() {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const userData = await getCurrentUserData(session);
const user = {
  id: userData?.id,
  email: userData?.email,
  name: userData?.name,
  image: userData?.image,
  role: userData?.role || "user",
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