import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

interface NotificationRequest {
  quoteId: string;
  channels?: ("email" | "sms" | "inapp")[];
}

// Placeholder functions for external services - replace with actual implementations
async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  // TODO: Integrate with SendGrid, Mailgun, or similar service
  console.log(`Sending email to ${to}:`, { subject, html });
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => resolve(true), 1000);
  });
}

async function sendSMS(to: string, message: string): Promise<boolean> {
  // TODO: Integrate with Twilio, AWS SNS, or similar service
  console.log(`Sending SMS to ${to}:`, message);
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => resolve(true), 1000);
  });
}

async function createInAppNotification(userId: string, title: string, message: string): Promise<void> {
  // TODO: Create in-app notification in Firestore
  console.log(`Creating in-app notification for user ${userId}:`, { title, message });
  // Simulate creating notification
  await addDoc(collection(db, "notifications"), {
    userId,
    title,
    message,
    type: "quote_response",
    read: false,
    createdAt: serverTimestamp(),
  });
}

export async function POST(request: NextRequest) {
  try {
    const { quoteId, channels = ["email", "sms", "inapp"] }: NotificationRequest = await request.json();

    if (!quoteId) {
      return NextResponse.json(
        { error: "Quote ID is required" },
        { status: 400 }
      );
    }

    // Get quote details
    const quoteRef = doc(db, "quotes", quoteId);
    const quoteSnap = await getDoc(quoteRef);

    if (!quoteSnap.exists()) {
      return NextResponse.json(
        { error: "Quote not found" },
        { status: 404 }
      );
    }

    const quote = quoteSnap.data();

    // Check if already notified
    if (quote.notified) {
      return NextResponse.json(
        { message: "Quote already notified" },
        { status: 200 }
      );
    }

    // Check if status is completed
    if (quote.status !== "completed") {
      return NextResponse.json(
        { error: "Quote status must be completed to send notifications" },
        { status: 400 }
      );
    }

    const results = {
      email: false,
      sms: false,
      inapp: false,
    };

    const notificationPromises = [];

    // Send email notification
    if (channels.includes("email")) {
      notificationPromises.push(
        sendEmail(
          quote.email,
          "Quote Response from AweGift",
          `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Quote Response</h2>
            <p>Dear ${quote.fullName},</p>
            <p>Thank you for your quote request. We have reviewed your requirements and prepared a response:</p>
            <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px;">
              <p><strong>Your Request:</strong></p>
              <p>${quote.reason}</p>
              <p><strong>Our Response:</strong></p>
              <p>${quote.adminResponse || "Please contact us for detailed response."}</p>
            </div>
            <p>If you have any questions, please don't hesitate to contact us.</p>
            <p>Best regards,<br>The Shofy Team</p>
          </div>
          `
        ).then(success => {
          results.email = success;
        })
      );
    }

    // Send SMS notification
    if (channels.includes("sms")) {
      notificationPromises.push(
        sendSMS(
          quote.phone,
          `Shofy: Your quote request has been processed. Please check your email for details or contact us at support@shofy.com`
        ).then(success => {
          results.sms = success;
        })
      );
    }

    // Create in-app notification
    if (channels.includes("inapp")) {
      notificationPromises.push(
        createInAppNotification(
          quote.email, // Using email as userId for now
          "Quote Response Available",
          `Your quote request has been processed. ${quote.adminResponse ? "Check your email for our detailed response." : "Please contact us for more information."}`
        ).then(() => {
          results.inapp = true;
        })
      );
    }

    // Wait for all notifications to complete
    await Promise.all(notificationPromises);

    // Update quote to mark as notified
    await updateDoc(quoteRef, {
      notified: true,
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json(
      {
        message: "Notifications sent successfully",
        results,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}