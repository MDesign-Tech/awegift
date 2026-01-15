import { NextRequest, NextResponse } from "next/server";
import { generateEmailVerificationInfo, saveEmailVerification, sendDualVerificationEmail } from "@/lib/auth/utils";
import { adminDb } from "@/lib/firebase/admin";

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(
                { error: "Email is required" },
                { status: 400 }
            );
        }

        // Check if user exists and is not already verified
        const userSnapshot = await adminDb.collection("users").where("email", "==", email).get();

        if (userSnapshot.empty) {
            return NextResponse.json(
                { error: "No user found with this email" },
                { status: 404 }
            );
        }

        const userDoc = userSnapshot.docs[0];
        const userData = userDoc.data();

        if (userData.emailVerified) {
            return NextResponse.json(
                { error: "Email is already verified" },
                { status: 400 }
            );
        }

        // Generate new credentials
        const { token, otp, expires } = generateEmailVerificationInfo();

        // Save/Update verification record
        await saveEmailVerification(userDoc.id, email, token, otp, expires);

        // Send email
        await sendDualVerificationEmail(email, userData.name, token, otp);

        return NextResponse.json(
            { message: "Verification code sent successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Resend verification error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
