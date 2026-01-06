import crypto from "crypto";
import bcrypt from "bcryptjs";
import { adminDb } from "../firebase/admin";
import { emailService } from "../email/service";

/**
 * Generate a secure random token
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Generate OTP (6-digit number)
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate email verification credentials (OTP + Token)
 */
export function generateEmailVerificationInfo(): { token: string; otp: string; expires: string } {
  const token = generateSecureToken();
  const otp = generateOTP();
  const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes
  return { token, otp, expires };
}

/**
 * Save email verification record
 */
export async function saveEmailVerification(
  userId: string,
  email: string,
  token: string,
  otp: string,
  expiresAt: string
): Promise<void> {
  const hashedOtp = await bcrypt.hash(otp, 12);
  const verificationRef = adminDb.collection("verificationTokens").doc(email);

  await verificationRef.set({
    userId,
    email,
    token,
    otp: hashedOtp,
    expiresAt,
    attempts: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Send dual verification email (OTP + Link)
 */
export async function sendDualVerificationEmail(
  email: string,
  name: string,
  token: string,
  otp: string
): Promise<void> {
  const verificationUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000"}/auth/verify-email?token=${token}`;

  try {
    await emailService.sendEmail({
      type: "EMAIL_VERIFICATION",
      to: email,
      name,
      verificationUrl,
      otp, // Pass raw OTP to template
    });
  } catch (error) {
    console.error("Error sending dual verification email:", error);
    throw new Error("Failed to send verification email");
  }
}

/**
 * Verify email verification token
 */
export async function verifyEmailToken(token: string): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    const verificationRef = adminDb.collection("verificationTokens");
    const querySnapshot = await verificationRef
      .where("token", "==", token)
      .get();

    if (querySnapshot.empty) {
      return { success: false, error: "Invalid verification link or it has already been used." };
    }

    const verificationDoc = querySnapshot.docs[0];
    const verificationData = verificationDoc.data();

    // Check expiry
    if (new Date(verificationData.expiresAt) < new Date()) {
      return { success: false, error: "Verification link has expired. Please request a new one." };
    }

    // Mark email as verified in user doc
    const userRef = adminDb.collection("users").doc(verificationData.userId);
    await userRef.update({
      emailVerified: true,
      updatedAt: new Date().toISOString(),
    });

    // Delete verification record
    await verificationDoc.ref.delete();

    return { success: true, userId: verificationData.userId };
  } catch (error) {
    console.error("Error verifying email token:", error);
    return { success: false, error: "Failed to verify email" };
  }
}

/**
 * Verify OTP
 */
export async function verifyOTP(email: string, otp: string): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    const verificationRef = adminDb.collection("verificationTokens").doc(email);
    const verificationDoc = await verificationRef.get();

    if (!verificationDoc.exists) {
      return { success: false, error: "No verification record found for this email." };
    }

    const verificationData = verificationDoc.data()!;

    // Rate limiting check
    if (verificationData.attempts >= 5) {
      return { success: false, error: "Too many failed attempts. Please request a new code." };
    }

    // Check expiry
    if (new Date(verificationData.expiresAt) < new Date()) {
      return { success: false, error: "Verification code has expired." };
    }

    // Compare OTP
    const isMatched = await bcrypt.compare(otp, verificationData.otp);
    if (!isMatched) {
      await verificationRef.update({
        attempts: verificationData.attempts + 1,
        updatedAt: new Date().toISOString(),
      });
      return { success: false, error: "Invalid verification code." };
    }

    // Mark email as verified in user doc
    const userRef = adminDb.collection("users").doc(verificationData.userId);
    await userRef.update({
      emailVerified: true,
      updatedAt: new Date().toISOString(),
    });

    // Delete verification record
    await verificationRef.delete();

    return { success: true, userId: verificationData.userId };
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return { success: false, error: "Failed to verify email" };
  }
}

/**
 * Generate password reset token and expiry
 */
export function generatePasswordResetToken(): { token: string; expires: string } {
  const token = generateSecureToken();
  const expires = new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(); // 1 hour
  return { token, expires };
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  token: string
): Promise<void> {
  const resetUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000"}/auth/reset-password?token=${token}`;

  try {
    await emailService.sendEmail({
      type: "PASSWORD_RESET",
      to: email,
      name,
      resetUrl,
    });
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw new Error("Failed to send password reset email");
  }
}

/**
 * Verify password reset token
 */
export async function verifyPasswordResetToken(token: string): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    const usersRef = adminDb.collection("users");
    const querySnapshot = await usersRef
      .where("passwordResetToken", "==", token)
      .get();

    if (querySnapshot.empty) {
      return { success: false, error: "Invalid reset token" };
    }

    const userDoc = querySnapshot.docs[0];
    const user = userDoc.data();

    // Check if token is expired
    if (!user.passwordResetExpires || new Date(user.passwordResetExpires) < new Date()) {
      return { success: false, error: "Reset token has expired" };
    }

    return { success: true, userId: userDoc.id };
  } catch (error) {
    console.error("Error verifying password reset token:", error);
    return { success: false, error: "Failed to verify reset token" };
  }
}

/**
 * Reset password with token
 */
export async function resetPasswordWithToken(
  token: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const verification = await verifyPasswordResetToken(token);
    if (!verification.success || !verification.userId) {
      return { success: false, error: verification.error };
    }

    const userDoc = adminDb.collection("users").doc(verification.userId);
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await userDoc.update({
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error resetting password:", error);
    return { success: false, error: "Failed to reset password" };
  }
}
