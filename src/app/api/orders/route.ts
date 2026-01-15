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
import { adminDb } from "@/lib/firebase/admin";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchUserFromFirestore } from "@/lib/firebase/adminUser";

// GET - Fetch orders based on user role
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user role
    const user = await fetchUserFromFirestore(session.user.id);
    if (!user) {
        return NextResponse.json(
          { error: "User deleted", code: "USER_DELETED" },
          { status: 401 }
        );
    }

    // Users can only see their own orders
    const ordersQuery = adminDb.collection("orders").where("userId", "==", user.id);

    const ordersSnapshot = await ordersQuery.get();

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
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user from Firestore using the new function
    const user = await fetchUserFromFirestore(session.user.id);
    if (!user) {
        return NextResponse.json(
          { error: "User deleted", code: "USER_DELETED" },
          { status: 401 }
        );
    }

    // Check if user has permission to create orders
    if (!hasPermission(user.role as UserRole, "canCreateOrders")) {
      return NextResponse.json({ error: "You don't have permission to create orders" }, { status: 403 });
    }

    const orderData: OrderData = await request.json();

    // Fetch SKUs for items if not provided
    const itemsWithSku = await Promise.all(
      orderData.items.map(async (item) => {
        if (item.sku) return item; // Already has SKU

        try {
          const productDoc = await adminDb.collection("products").doc(item.productId).get();
          if (productDoc.exists) {
            const productData = productDoc.data();
            return { ...item, sku: productData?.sku || "" };
          }
        } catch (error) {
          console.warn("Failed to fetch product SKU for", item.productId, error);
        }
        return { ...item, sku: "" };
      })
    );

    // Create order with OrderData structure
    const newOrder: OrderData = {
      ...orderData,
      items: itemsWithSku,
      userId: user.id,
      status: ORDER_STATUSES.PENDING,
      paymentStatus: PAYMENT_STATUSES.PENDING,
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
    const docRef = await adminDb.collection("orders").add(newOrder);

    await docRef.update({ id: docRef.id });

    

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
