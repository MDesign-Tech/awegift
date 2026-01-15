import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { adminDb } from "@/lib/firebase/admin";
import speakeasy from "speakeasy";
import qrcode from "qrcode";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
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

    // Check if 2FA is already enabled
    if (userData?.twoFactorEnabled) {
      return NextResponse.json(
        { error: "2FA is already enabled" },
        { status: 400 }
      );
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `AweGift (${userData?.email})`,
      issuer: "AweGift"
    });

    // Generate QR code
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url!);

    // Store secret temporarily (will be confirmed later)
    await userDoc.ref.update({
      twoFactorSecret: secret.base32,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      secret: secret.base32,
      qrCodeUrl,
      message: "Scan the QR code with your authenticator app and verify the code"
    });
  } catch (error) {
    console.error("Enable 2FA error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}