import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { generatePasswordResetToken, sendPasswordResetEmail } from "@/lib/auth/utils";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const usersRef = adminDb.collection("users");
    const querySnapshot = await usersRef.where("email", "==", email).get();

    if (querySnapshot.empty) {
      // Don't reveal if email exists or not for security
      return NextResponse.json({
        success: true,
        message: "If an account with this email exists, a password reset link has been sent."
      });
    }

    const userDoc = querySnapshot.docs[0];
    const user = userDoc.data();

    // Generate password reset token
    const { token: resetToken, expires: resetExpires } = generatePasswordResetToken();

    // Update user with reset token
    await userDoc.ref.update({
      passwordResetToken: resetToken,
      passwordResetExpires: resetExpires,
      updatedAt: new Date().toISOString(),
    });

    // Send password reset email
    try {
      await sendPasswordResetEmail(user.email, user.name, resetToken);
    } catch (emailError) {
      console.error("Error sending password reset email:", emailError);
      return NextResponse.json(
        { success: false, error: "Failed to send password reset email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "If an account with this email exists, a password reset link has been sent."
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
