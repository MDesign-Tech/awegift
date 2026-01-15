import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { adminDb } from "@/lib/firebase/admin";
import { OrderData, OrderItem, Address } from "../../../../../type";
import { ORDER_STATUSES, PAYMENT_STATUSES, PAYMENT_METHODS } from "@/lib/orderStatus";
import { UserRole } from "@/lib/rbac/roles";

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

    // Fetch user from Firestore using Admin SDK
    // The previous fetchUserFromFirestore was client-side, so we query directly here
    const userSnapshot = await adminDb.collection("users").where("email", "==", email).limit(1).get();

    if (userSnapshot.empty) {
        return NextResponse.json(
          { error: "User deleted", code: "USER_DELETED" },
          { status: 401 }
        );
    }

    const userDoc = userSnapshot.docs[0];
    const user = { id: userDoc.id, ...userDoc.data() } as any;

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
    const items: OrderItem[] = [];
    for (const item of session.line_items?.data || []) {
      const product = item.price?.product as any; // Cast to any since expand should make it Product
      const productId = product?.metadata?.productId || product?.id || "0";
      let sku = product?.metadata?.sku || "";

      // If sku not in metadata, fetch from Firestore product
      if (!sku && productId !== "0") {
        try {
          const productDoc = await adminDb.collection("products").doc(productId).get();
          if (productDoc.exists) {
            const productData = productDoc.data();
            sku = productData?.sku || "";
          }
        } catch (error) {
          console.warn("Failed to fetch product SKU:", error);
        }
      }

      items.push({
        productId,
        title: product?.name || "",
        price: item.price?.unit_amount ? item.price.unit_amount / 100 : 0,
        quantity: item.quantity || 0,
        thumbnail: "", // No thumbnail in Stripe line items
        sku,
      });
    }

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

    // Add to orders collection via Admin SDK
    const docRef = await adminDb.collection("orders").add(orderData);

    // Update doc to set id field to docRef.id
    await docRef.update({ id: docRef.id });

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
