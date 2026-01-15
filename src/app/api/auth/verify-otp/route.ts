import { NextRequest, NextResponse } from "next/server";
import { verifyOTP } from "@/lib/auth/utils";
import { emailService } from "@/lib/email/service";
import { adminDb } from "@/lib/firebase/admin";

export async function POST(request: NextRequest) {
    try {
        const { email, otp } = await request.json();

        if (!email || !otp) {
            return NextResponse.json(
                { error: "Email and OTP are required" },
                { status: 400 }
            );
        }

        const result = await verifyOTP(email, otp);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || "Verification failed" },
                { status: 400 }
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
            console.error("Error sending welcome email after OTP verification:", emailError);
        }

        return NextResponse.json(
            { message: "Email verified successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("OTP verification error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
