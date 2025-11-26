import { NextRequest, NextResponse } from "next/server";
import { OrderData, OrderItem, OrderStatusHistory } from "../../../../type";
import { UserRole, hasPermission } from "@/lib/rbac/roles";
import {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  PAYMENT_METHODS,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
} from "@/lib/orderStatus";
import { db } from "@/lib/firebase/config";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  setDoc,
  addDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { auth } from "../../../../auth";
import { fetchUserFromFirestore } from "@/lib/firebase/userService";

// GET - Fetch orders based on user role
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user role
    const user = await fetchUserFromFirestore(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Users can only see their own orders
    const ordersQuery = query(
      collection(db, "orders"),
      where("userId", "==", user.id)
    );

    const ordersSnapshot = await getDocs(ordersQuery);

    const orders = ordersSnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Sort by createdAt desc

    console.log(orders)

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// POST - Create new order (from checkout)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user from Firestore using the new function
    const user = await fetchUserFromFirestore(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has permission to create orders
    if (!hasPermission(user.role as UserRole, "canCreateOrders")) {
      return NextResponse.json({ error: "You don't have permission to create orders" }, { status: 403 });
    }

    const orderData: OrderData = await request.json();

    // Create order with OrderData structure
    const newOrder: OrderData = {
      ...orderData,
      userId: user.id,
      status: ORDER_STATUSES.PENDING,
      paymentStatus:
        orderData.paymentMethod === PAYMENT_METHODS.CASH
          ? PAYMENT_STATUSES.PENDING
          : PAYMENT_STATUSES.PAID,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      statusHistory: [
        {
          status: ORDER_STATUSES.PENDING,
          changedBy: session.user.email,
          changedByRole: user.role as UserRole,
          timestamp: new Date().toISOString(),
          notes: "Order placed",
        },
      ],
    };

    // Add to orders collection with auto-generated ID
    const docRef = await addDoc(collection(db, "orders"), newOrder);

    await updateDoc(docRef, { id: docRef.id });

    return NextResponse.json({
      success: true,
      id: docRef.id,
      message: "Order created successfully",
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
