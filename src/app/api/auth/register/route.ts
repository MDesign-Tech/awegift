import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { adminDb } from "@/lib/firebase/admin";
import { emailService } from "@/lib/email/service";
import { createAdminNewUserNotification } from "@/lib/notification/helpers";
import { generateEmailVerificationInfo, saveEmailVerification, sendDualVerificationEmail } from "@/lib/auth/utils";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, oauth, image } = await request.json();

    // Validation
    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // For non-OAuth registration, password is required
    if (!oauth && (!password || password.length < 6)) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const usersRef = adminDb.collection("users");
    const existingUser = await usersRef.where("email", "==", email).get();

    if (!existingUser.empty) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password only for non-OAuth users
    let hashedPassword = null;
    if (password && !oauth) {
      hashedPassword = await bcrypt.hash(password, 12);
    }

    // Generate email verification credentials
    const { token, otp, expires } = generateEmailVerificationInfo();

    // Create user in Firestore
    const userDoc = await usersRef.add({
      name,
      email,
      password: hashedPassword,
      image: image || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      emailVerified: false, // Always require verification
      role: "user",
      provider: oauth ? "oauth" : "credentials",
      profile: {
        firstName: name.split(" ")[0] || "",
        lastName: name.split(" ").slice(1).join(" ") || "",
        phone: "",
        addresses: [],
      },
      preferences: {
        newsletter: false,
        notifications: true,
      },
      cart: [],
      wishlist: [],
      orders: [],
    });

    // Save verification record to separate collection
    await saveEmailVerification(userDoc.id, email, token, otp, expires);

    // Send dual verification email (OTP + Link) asynchronously
    sendDualVerificationEmail(email, name, token, otp)
      .then(() => console.log('Verification email sent successfully to:', email))
      .catch((error: any) => console.error('Error sending verification email:', error));

    // Send email to admin asynchronously
    emailService.sendAdminNewUserEmail('axyz37914@gmail.com', name)
      .catch((error: any) => console.error('Error sending admin notification email:', error));

    // Send admin notification for new user registration asynchronously
    createAdminNewUserNotification('admin', name, email)
      .catch((error: any) => console.error('Error creating admin notification:', error));

    return NextResponse.json(
      {
        message: "User created successfully. Please verify your email.",
        userId: userDoc.id,
        email: email, // Include email for the verification page redirect
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
