import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/firebase/config";
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { OrderData, OrderItem, Address } from "../../../../../type";
import { ORDER_STATUSES, PAYMENT_STATUSES, PAYMENT_METHODS, PaymentStatus, PaymentMethod } from "@/lib/orderStatus";
import { UserRole } from "@/lib/rbac/roles";
import { fetchUserFromFirestore } from "@/lib/firebase/userService";
import { auth } from "../../../../../auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { sessionId, email } = await request.json();

    if (!sessionId || !email) {
      return NextResponse.json(
        { success: false, error: "Session ID and email are required" },
        { status: 400 }
      );
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items", "line_items.data.price.product"],
    });

    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { success: false, error: "Payment not completed" },
        { status: 400 }
      );
    }

    // Fetch user from Firestore using the new function
    const user = await fetchUserFromFirestore(email);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Extract order adress from session metadata
    let orderAddress: Address | undefined;
    if (session.metadata?.orderAddress) {
      try {
        orderAddress = JSON.parse(session.metadata.orderAddress);
      } catch (e) {
        console.warn("Failed to parse order location from metadata:", e);
      }
    }

    // Map items to OrderItem
    const items: OrderItem[] = session.line_items?.data?.map((item: any) => ({
      productId: item.price?.product?.metadata?.productId || item.price?.product?.id || "0",
      title: item.price?.product?.name || "",
      price: item.price?.unit_amount ? item.price.unit_amount / 100 : 0,
      quantity: item.quantity,
      thumbnail: item.thumbnail || "",
      sku: item.price?.product?.metadata?.sku || "",
    })) || [];

    // Calculate total amount
    const totalAmount = session.amount_total ? session.amount_total / 100 : 0;

    // Create order data matching OrderData interface
    const orderData: OrderData = {
      id: "", // Will be set after addDoc
      userId: user.id,
      customerName: user.name || user.email,
      customerEmail: user.email,
      status: ORDER_STATUSES.PENDING,
      items: items,
      totalAmount: totalAmount,
      orderAddress: orderAddress!,
      paymentMethod: PAYMENT_METHODS.ONLINE,
      paymentStatus: PAYMENT_STATUSES.PENDING, // Will be updated when payment is confirmed
      statusHistory: [
        {
          status: ORDER_STATUSES.PENDING,
          changedBy: user.email,
          changedByRole: user.role as UserRole,
          timestamp: new Date().toISOString(),
          notes: "Order placed via online payment",
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add to orders collection with auto-generated ID
    const docRef = await addDoc(collection(db, "orders"), {
      ...orderData
    });

    // Update doc to set id field to docRef.id
    await updateDoc(docRef, { id: docRef.id });

    return NextResponse.json({
      success: true,
      id: docRef.id,
      message: "Order created successfully",
    });
  } catch (error) {
    console.error("Order processing error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process order" },
      { status: 500 }
    );
  }
}
