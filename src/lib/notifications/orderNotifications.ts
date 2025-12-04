import { db } from "@/lib/firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

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

export interface OrderNotificationData {
  orderId: string;
  userId: string;
  userEmail: string;
  userPhone?: string;
  oldStatus: string;
  newStatus: string;
  orderDetails: {
    totalAmount: number;
    items: any[];
    orderId: string;
  };
}

export async function sendOrderStatusNotification(data: OrderNotificationData) {
  const { orderId, userId, userEmail, userPhone, oldStatus, newStatus, orderDetails } = data;

  try {
    // Create in-app notification
    const title = oldStatus ? `Order Status Updated` : `Order Placed Successfully`;
    const message = oldStatus
      ? `Your order #${orderDetails.orderId} status has changed from ${oldStatus} to ${newStatus}.`
      : `Your order #${orderDetails.orderId} has been placed successfully and is now ${newStatus}.`;

    await addDoc(collection(db, "notifications"), {
      userId: userEmail, // Using email as userId for consistency
      title,
      message,
      type: "order_update",
      read: false,
      orderId,
      oldStatus: oldStatus || null,
      newStatus,
      createdAt: serverTimestamp(),
    });

    // Send email notification
    const emailSubject = oldStatus ? `Order Status Update - ${orderDetails.orderId}` : `Order Confirmation - ${orderDetails.orderId}`;
    const emailHeading = oldStatus ? `Order Status Update` : `Order Confirmation`;
    const emailIntro = oldStatus
      ? `Your order status has been updated:`
      : `Thank you for your order! Here are the details:`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${emailHeading}</h2>
        <p>Dear Customer,</p>
        <p>${emailIntro}</p>
        <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px;">
          <p><strong>Order ID:</strong> ${orderDetails.orderId}</p>
          ${oldStatus ? `<p><strong>Previous Status:</strong> ${oldStatus}</p>` : ''}
          <p><strong>Current Status:</strong> ${newStatus}</p>
          <p><strong>Total Amount:</strong> $${orderDetails.totalAmount}</p>
        </div>
        <p>You can track your order status in your account dashboard.</p>
        <p>Thank you for shopping with us!</p>
  <p>Best regards,<br>The AweGift Team</p>
      </div>
    `;

    await sendEmail(
      userEmail,
      emailSubject,
      emailHtml
    );

    // Send SMS notification if phone number is available
    if (userPhone) {
  const smsMessage = `AweGift: Your order ${orderDetails.orderId} status changed from ${oldStatus} to ${newStatus}. Track at your dashboard.`;
      await sendSMS(userPhone, smsMessage);
    }

    console.log(`Order notification sent for order ${orderId}: ${oldStatus} → ${newStatus}`);
  } catch (error) {
    console.error("Error sending order notification:", error);
    throw error;
  }
}

export function getOrderStatusMessage(status: string): string {
  const messages: Record<string, string> = {
    pending: "Your order has been received and is being processed.",
    processing: "Your order is being prepared for shipment.",
    shipped: "Your order has been shipped and is on its way.",
    delivered: "Your order has been delivered successfully.",
    cancelled: "Your order has been cancelled.",
    refunded: "Your order has been refunded.",
  };

  return messages[status] || `Your order status has been updated to ${status}.`;
}