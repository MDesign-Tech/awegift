import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { OrderData } from "../../../../../type";
import { emailService } from "@/lib/email/service";
import {
  createOrderPlacedNotification,
  createAdminOrderAlertNotification
} from "@/lib/notification/helpers";


export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orderData = await request.json();
    const userId = session.user.id;
    orderData.userId = userId;

    // Save the order to the orders collection with custom ID
    await adminDb.collection("orders").doc(orderData.id).set(orderData);

    // Send order confirmation notification to customer and admin alert asynchronously
    // Send customer notification (includes email)
    const customerNotificationPromise = createOrderPlacedNotification(
      orderData.userId,
      orderData.customerEmail,
      orderData.customerName,
      orderData.id,
      orderData.totalAmount,
      'RWF',
      orderData
    );

    // Send admin alert notification
    const adminNotificationPromise = createAdminOrderAlertNotification(
      'admin', // Admin user ID - should be configurable
      orderData.id,
      orderData.customerName,
      orderData.totalAmount,
      'RWF',
      orderData
    );

    // Handle notification creation errors without blocking the response
    Promise.allSettled([customerNotificationPromise, adminNotificationPromise])
      .then(results => {
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.error(`Notification ${index === 0 ? 'customer' : 'admin'} failed:`, result.reason);
          } else if (result.value && !result.value.success) {
            console.error(`Notification ${index === 0 ? 'customer' : 'admin'} failed:`, result.value.error);
          }
        });
      })
      .catch(error => {
        console.error('Error creating order notifications:', error);
      });

    return NextResponse.json({
      message: "Order placed successfully",
      success: true,
      id: orderData.id,
    });
  } catch (error) {
    console.error("Error placing order:", error);
    return NextResponse.json(
      { error: "Failed to place order" },
      { status: 500 }
    );
  }
}
