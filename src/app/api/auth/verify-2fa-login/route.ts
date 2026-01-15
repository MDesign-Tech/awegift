import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import speakeasy from "speakeasy";

export async function POST(request: NextRequest) {
  try {
    const { email, tempToken, otp } = await request.json();

    if (!email || !tempToken || !otp) {
      return NextResponse.json(
        { error: "Email, temp token, and OTP are required" },
        { status: 400 }
      );
    }

    // Find user by email
    const usersRef = adminDb.collection("users");
    const querySnapshot = await usersRef.where("email", "==", email).get();

    if (querySnapshot.empty) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userDoc = querySnapshot.docs[0];
    const user = userDoc.data();

    // Check temp token
    if (user.temp2FAToken !== tempToken || !user.temp2FATokenExpires) {
      return NextResponse.json(
        { error: "Invalid or expired verification token" },
        { status: 400 }
      );
    }

    if (user.temp2FATokenExpires < Date.now()) {
      return NextResponse.json(
        { error: "Verification token expired" },
        { status: 400 }
      );
    }

    // Check if 2FA is enabled
    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json(
        { error: "2FA not enabled for this account" },
        { status: 400 }
      );
    }

    // Verify TOTP
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: otp,
      window: 2, // Allow 2 time windows (30 seconds each)
    });

    if (!verified) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    // Clear temp token
    await userDoc.ref.update({
      temp2FAToken: null,
      temp2FATokenExpires: null,
    });

    // Return success with special password for NextAuth
    return NextResponse.json({
      success: true,
      email: user.email,
      password: "2FA_VERIFIED", // Special password to bypass checks
    });
  } catch (error) {
    console.error("Verify 2FA login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}