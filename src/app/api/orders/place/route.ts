import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import {
  collection,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

export async function POST(request: NextRequest) {
  try {
    const orderData = await request.json();
    const { customerEmail } = orderData;

    if (!customerEmail) {
      return NextResponse.json(
        { error: "Customer email required" },
        { status: 400 }
      );
    }

    // Generate a unique order ID
    const orderId = `ORD-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)
      .toUpperCase()}`;

    // Create the order object
    const order = {
      id: orderId,
      orderId: orderId,
      ...orderData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Save the order to the orders collection using orderId as document ID
    const orderRef = doc(db, "orders", orderId);
    await setDoc(orderRef, order);

    return NextResponse.json({
      message: "Order placed successfully",
      success: true,
      orderId: orderId,
      order: order,
    });
  } catch (error) {
    console.error("Error placing order:", error);
    return NextResponse.json(
      { error: "Failed to place order" },
      { status: 500 }
    );
  }
}
