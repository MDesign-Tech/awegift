import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ORDER_STATUSES, PAYMENT_METHODS, PAYMENT_STATUSES } from "@/lib/orderStatus";
import { UserRole } from "@/lib/rbac/roles";
import {
  createOrderPlacedNotification,
  createAdminOrderAlertNotification,
} from "@/lib/notification/helpers";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let requestData: Record<string, unknown>;
    try {
      requestData = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid order details." }, { status: 400 });
    }

    const rawItems = requestData.items;
    const rawAddress = requestData.orderAddress;
    const rawAddressData =
      rawAddress && typeof rawAddress === "object"
        ? (rawAddress as Record<string, unknown>)
        : null;
    const addressText =
      typeof rawAddressData?.address === "string"
        ? rawAddressData.address.trim()
        : "";
    if (
      !Array.isArray(rawItems) ||
      rawItems.length === 0 ||
      rawItems.length > 50 ||
      !addressText ||
      addressText.length > 500
    ) {
      return NextResponse.json(
        { error: "Order items and a delivery address are required." },
        { status: 400 },
      );
    }

    const products = await Promise.all(
      rawItems.map(async (rawItem: unknown) => {
        if (!rawItem || typeof rawItem !== "object") return null;
        const item = rawItem as Record<string, unknown>;
        if (
          typeof item.productId !== "string" ||
          !item.productId ||
          item.productId.length > 128 ||
          item.productId.includes("/") ||
          !Number.isSafeInteger(item.quantity) ||
          Number(item.quantity) <= 0 ||
          Number(item.quantity) > 1000
        ) {
          return null;
        }

        const productSnapshot = await adminDb
          .collection("products")
          .doc(item.productId)
          .get();
        if (!productSnapshot.exists) return null;

        const product = productSnapshot.data()!;
        const price = Number(product.price);
        if (
          product.isActive === false ||
          !Number.isFinite(price) ||
          price < 0 ||
          (product.currency && product.currency !== "RWF")
        ) {
          return null;
        }
        return {
          productId: productSnapshot.id,
          title: String(product.title || "Product"),
          price,
          quantity: Number(item.quantity),
          thumbnail:
            typeof product.thumbnail === "string"
              ? product.thumbnail
              : Array.isArray(product.images) && typeof product.images[0] === "string"
                ? product.images[0]
                : "",
          sku: typeof product.sku === "string" ? product.sku : "",
        };
      }),
    );

    if (products.some((product) => product === null)) {
      return NextResponse.json(
        { error: "One or more products are unavailable or have invalid quantities." },
        { status: 400 },
      );
    }

    const orderItems = products.filter(
      (product): product is NonNullable<typeof product> => product !== null,
    );
    const totalAmount =
      Math.round(
        orderItems.reduce(
          (total, product) => total + product.price * product.quantity,
          0,
        ) * 100,
      ) / 100;
    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      return NextResponse.json({ error: "The order total is invalid." }, { status: 400 });
    }

    const now = new Date().toISOString();
    const orderId = `ORD-${crypto.randomUUID()}`;
    const orderData = {
      id: orderId,
      userId: session.user.id,
      customerName: session.user.name || session.user.email,
      customerEmail: session.user.email,
      status: ORDER_STATUSES.PENDING,
      items: orderItems,
      totalAmount,
      currency: "RWF",
      pricingVerified: true,
      orderAddress: {
        address: addressText,
        ...(typeof rawAddressData?.id === "string"
          ? { id: rawAddressData.id }
          : {}),
      },
      paymentMethod: PAYMENT_METHODS.PAWAPAY,
      paymentStatus: PAYMENT_STATUSES.PENDING,
      statusHistory: [
        {
          status: ORDER_STATUSES.PENDING,
          changedBy: session.user.email,
          changedByRole: (session.user.role || "user") as UserRole,
          timestamp: now,
          notes: "Order placed from cart",
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    await adminDb.collection("orders").doc(orderId).create(orderData);

    // Send order confirmation notification to customer and admin alert asynchronously
    const customerNotificationPromise = createOrderPlacedNotification(
      orderData.userId,
      orderData.customerEmail,
      orderData.customerName,
      orderData.id,
      orderData.totalAmount,
      'RWF',
      orderData
    );

    const adminNotificationPromise = createAdminOrderAlertNotification(
      "admin",
      orderData.id,
      orderData.customerName,
      orderData.totalAmount,
      'RWF',
      orderData
    );

    Promise.allSettled([customerNotificationPromise, adminNotificationPromise])
      .then(results => {
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.error(`Order notification ${index === 0 ? "customer" : "admin"} failed.`);
          } else if (result.value && !result.value.success) {
            console.error(`Order notification ${index === 0 ? "customer" : "admin"} failed.`);
          }
        });
      })
      .catch(error => {
        console.error("Error creating order notifications.");
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
