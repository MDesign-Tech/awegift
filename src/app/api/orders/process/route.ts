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

    // Extract shipping address
    let shippingAddress: Address | undefined;
    if (session.metadata?.shippingAddress) {
      try {
        shippingAddress = JSON.parse(session.metadata.shippingAddress);
      } catch (e) {
        console.warn("Failed to parse shipping address from metadata:", e);
      }
    }

    // Map items to OrderItem
    const items: OrderItem[] = session.line_items?.data?.map((item: any) => ({
      productId: parseInt(item.price?.product?.metadata?.productId || item.price?.product?.id || "0"),
      title: item.price?.product?.name || "",
      price: item.price?.unit_amount ? item.price.unit_amount / 100 : 0,
      quantity: item.quantity,
      thumbnail: item.price?.product?.images?.[0] || "",
      sku: item.price?.product?.metadata?.sku || "",
      total: item.amount_total ? item.amount_total / 100 : 0,
    })) || [];

    // Calculate total amount
    const totalAmount = session.amount_total ? session.amount_total / 100 : 0;

    // Create order data matching OrderData interface
    const orderData: OrderData = {
      id: "", // Will be set after addDoc
      userId: user.id,
      status: ORDER_STATUSES.PENDING,
      items: items,
      totalAmount: totalAmount,
      shippingAddress: shippingAddress!,
      paymentMethod: "online" as PaymentMethod,
      paymentStatus: "paid" as PaymentStatus,
      statusHistory: [
        {
          status: ORDER_STATUSES.PENDING,
          changedBy: user.email,
          changedByRole: user.role as UserRole,
          timestamp: new Date().toISOString(),
          notes: "Order placed via Stripe payment",
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
