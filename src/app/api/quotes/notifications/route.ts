import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { QuoteType } from "../../../../../type";

interface NotificationRequest {
  quoteId: string;
  channels?: ("email" | "sms" | "inapp")[];
}

// Placeholder functions for external services - replace with actual implementations
async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!to) return false;
  console.log(`Sending email to ${to}:`, { subject, html });
  // Simulate API call
  return new Promise((resolve) => setTimeout(() => resolve(true), 500));
}

async function sendSMS(to: string, message: string): Promise<boolean> {
  if (!to) return false;
  console.log(`Sending SMS to ${to}:`, message);
  // Simulate API call
  return new Promise((resolve) => setTimeout(() => resolve(true), 500));
}

async function createInAppNotification(userId: string | null, title: string, message: string, quoteId: string): Promise<void> {
  console.log(`Creating in-app notification for user ${userId}:`, { title, message });
  await addDoc(collection(db, "notifications"), {
    userId: userId || "unknown",
    title,
    message,
    type: "quote_response",
    read: false,
    quoteId,
    createdAt: serverTimestamp(),
  });
}

export async function POST(request: NextRequest) {
  try {
    const { quoteId, channels = ["email", "sms", "inapp"] }: NotificationRequest = await request.json();

    if (!quoteId) {
      return NextResponse.json({ error: "Quote ID is required" }, { status: 400 });
    }

    // Get quote details
    const quoteRef = doc(db, "quotes", quoteId);
    const quoteSnap = await getDoc(quoteRef);

    if (!quoteSnap.exists()) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    const quote = quoteSnap.data() as QuoteType;

    // Check if already notified
    if (quote.notified) {
      return NextResponse.json({ message: "Quote already notified" }, { status: 200 });
    }

    // Check if status is completed
    if (quote.status !== "completed") {
      return NextResponse.json({ error: "Quote status must be completed to send notifications" }, { status: 400 });
    }

    const results = { email: false, sms: false, inapp: false };
    const notificationPromises: Promise<any>[] = [];

    // Build a plain text summary of products and message
    const productsHtml = Array.isArray(quote.products)
      ? quote.products.map((p: any) => `<li>${String(p.name)} — Qty: ${String(p.quantity)}</li>`).join("")
      : "";

    const requestSummary = `<div><p><strong>Products:</strong></p><ul>${productsHtml}</ul><p><strong>Message:</strong></p><p>${quote.message || ""}</p></div>`;

    // Send email notification if email exists on the quote
    if (channels.includes("email") && quote.email) {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Quote Response</h2>
          <p>Thank you for your quote request. We have prepared a response:</p>
          <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px;">
            ${requestSummary}
            <p><strong>Our Response:</strong></p>
            <p>${quote.adminResponse || "Please contact us for a detailed response."}</p>
          </div>
          <p>Best regards,<br/>The Team</p>
        </div>
      `;

      notificationPromises.push(
        sendEmail(quote.email, "Quote Response", emailHtml).then((success) => {
          results.email = success;
        })
      );
    }

    // Send SMS if phone exists
    if (channels.includes("sms") && quote.phone) {
      const smsMsg = `Your quote request (${quote.id || quoteId}) has been processed. Check your email or account for details.`;
      notificationPromises.push(
        sendSMS(quote.phone, smsMsg).then((success) => {
          results.sms = success;
        })
      );
    }

    // In-app notification: try to use a requester id or email, fall back to quoteId
    if (channels.includes("inapp")) {
      const userId = quote.requesterId || quote.email || quoteId;
      const productsSummary = Array.isArray(quote.products)
        ? quote.products.map((p: any) => p.name).join(', ')
        : 'N/A';
      const shortMessage = quote.message ? (quote.message.length > 50 ? quote.message.substring(0, 50) + '...' : quote.message) : 'N/A';
      const shortResponse = quote.adminResponse ? (quote.adminResponse.length > 100 ? quote.adminResponse.substring(0, 100) + '...' : quote.adminResponse) : 'Please check your account for details.';
      const inAppMessage = `Quote response available. Click to view details.`;
      notificationPromises.push(
        createInAppNotification(userId, "Quote Response Available", inAppMessage, quoteId).then(() => {
          results.inapp = true;
        })
      );
    }

    await Promise.all(notificationPromises);

    // Update quote to mark as notified
    await updateDoc(quoteRef, { notified: true, updatedAt: serverTimestamp() });

    return NextResponse.json({ message: "Notifications sent successfully", results }, { status: 200 });
  } catch (error) {
    console.error("Error sending notifications:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}