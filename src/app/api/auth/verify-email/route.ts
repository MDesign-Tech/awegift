import { NextRequest, NextResponse } from "next/server";
import { verifyEmailToken } from "@/lib/auth/utils";
import { emailService } from "@/lib/email/service";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(
        new URL("/auth/verify-email?error=missing_token", request.url)
      );
    }

    const result = await verifyEmailToken(token);

    if (!result.success) {
      return NextResponse.redirect(
        new URL(`/auth/verify-email?error=${encodeURIComponent(result.error || "verification_failed")}`, request.url)
      );
    }

    // Send welcome email after successful verification
    try {
      const userDoc = await adminDb.collection("users").doc(result.userId!).get();

      if (userDoc.exists) {
        const userData = userDoc.data();
        if (userData) {
          await emailService.sendWelcomeEmail(userData.email, userData.name);
        }
      }
    } catch (emailError) {
      console.error("Error sending welcome email after verification:", emailError);
    }

    return NextResponse.redirect(
      new URL("/auth/verify-email?success=true", request.url)
    );
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.redirect(
      new URL("/auth/verify-email?error=server_error", request.url)
    );
  }
}
