import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { auth } from "@/auth";
import { OrderData } from "../../../../../type";


export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orderData: OrderData = await request.json();
    const userId = session.user.id;
    orderData.userId = userId;

    // Save the order to the orders collection with custom ID
    await adminDb.collection("orders").doc(orderData.id).set(orderData);

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
