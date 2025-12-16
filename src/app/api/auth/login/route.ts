import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { adminDb } from "@/lib/firebase/admin";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const snapshot = await adminDb
      .collection("users")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const doc = snapshot.docs[0];
    const user = doc.data();

    const isValid = await compare(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    // Return user data (without password)
    return NextResponse.json({
      user: {
        id: doc.id,
        email: user.email,
        name: user.name,
        image: user.image || null,
        role: user.role || "user",
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}