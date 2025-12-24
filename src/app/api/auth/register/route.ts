import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { adminDb } from "@/lib/firebase/admin";
import { emailService } from "@/lib/email/service";
import { createAdminNewUserNotification } from "@/lib/notification/helpers";
import { notificationService } from "@/lib/notification/service";

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

    // Create user in Firestore
    const userDoc = await usersRef.add({
      name,
      email,
      password: hashedPassword,
      image: image || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      emailVerified: oauth ? true : false, // OAuth emails are pre-verified
      role: "user",
      provider: oauth ? "oauth" : "credentials",
      profile: {
        firstName: name.split(" ")[0] || "",
        lastName: name.split(" ").slice(1).join(" ") || "",
        phone: "",
        addresses: [], // Use addresses array instead of single address
      },
      preferences: {
        newsletter: false,
        notifications: true,
      },
      cart: [],
      wishlist: [],
      orders: [],
    });

    // Send welcome email asynchronously (don't block the response)
    console.log('Sending welcome email to new user:', email);
    emailService.sendWelcomeEmail(email, name)
      .then(() => {
        console.log('Welcome email sent successfully to:', email);
      })
      .catch((error: any) => {
        console.error('Error sending welcome email:', error);
      });

    // send Email to admin asynchronously (don't block the response)
    console.log('Sending new user registration email to admin for new user registered:', email);
    emailService.sendAdminNewUserEmail('<EMAIL>', name)
      .then(() => {
        console.log('Admin notification email sent successfully for new user:', email);
      })
      .catch((error: any) => {
        console.error('Error sending admin notification email:', error);
      });

    // Send admin notification for new user registration asynchronously (don't block the response)
    console.log('Creating admin notification for new user:', userDoc.id, email, name);
    createAdminNewUserNotification('admin', name, email)
      .then((result: any) => {
        if (!result.success) {
          console.error('Failed to create admin notification:', result.error);
        } else {
          console.log('Successfully created admin notification:', result.notificationId);
        }
      })
      .catch((error: any) => {
        console.error('Error creating admin notification:', error);
      });

    return NextResponse.json(
      {
        message: "User created successfully",
        userId: userDoc.id,
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