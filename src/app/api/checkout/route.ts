import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { ORDER_STATUSES } from "@/lib/orderStatus";
import {
  PAYMENT_STATUSES,
  PAYMENT_METHODS,
} from "@/lib/orderStatus";
import { adminDb } from "@/lib/firebase/admin";
import admin from "firebase-admin";
// IMPORTANT: convertPrice is now an async function
import { convertPrice, formatCurrency } from "@/lib/currency";

// The export must remain async to use await inside it
export const POST = async (request: NextRequest) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  try {
    const reqBody = await request.json();
     let { items, email, orderAddress, orderId, orderAmount } = reqBody;

    let orderItems = items;
    let orderTotal = orderAmount;
    let existingOrder = null;

// If orderId is provided, fetch the existing order
if (orderId) {
  try {
    const orderRef = adminDb.collection("orders").doc(orderId);
    const orderDoc = await orderRef.get();

    if (orderDoc.exists) {
      existingOrder = orderDoc.data()!;
      orderItems = existingOrder.items;
      orderTotal = existingOrder.totalAmount;
      orderAddress = existingOrder.orderAddress;
    }
  } catch (error) {
    console.warn("Failed to fetch existing order, proceeding as new order:", error);
    existingOrder = null;
  }
}

    // --- Start of Currency Conversion Update ---
    
    // Create an array of Promises for parallel currency conversion
    const lineItemsPromises = 
        orderItems && orderItems.length > 0
        ? orderItems.map(async (item: any) => {
              const itemPrice =
                item.price ||
                (item.total ? item.total / (item.quantity || 1) : 0);
              
              // AWAIT the asynchronous conversion
              const itemPriceRWF = await convertPrice(itemPrice, "USD", "RWF");
              
              // Stripe uses cents/smallest unit, so multiply by 100 and round
              const unitAmountRWF = Math.round(itemPriceRWF * 100); 

              return {
                quantity: item?.quantity || 1,
                price_data: {
                  currency: "rwf",
                  unit_amount: unitAmountRWF,
                  product_data: {
                    name: item?.title || item?.name || "Product",
                    description:
                      item?.description ||
                      `Order item: ${item?.name || item?.title || "Product"}`,
                    images: Array.isArray(item.thumbnail) ? item.thumbnail : (item.thumbnail ? [item.thumbnail] : []),
                    metadata: {
                      productId: item?.id?.toString() || "",
                      originalPrice: item?.price?.toString() || "",
                      category: item?.categories && item.categories.length > 0 ? item.categories.join(", ") : "",
                      orderId: orderId || "",
                    },
                  },
                },
              };
          })
        : orderAmount
        ? [
            (async () => {
                // AWAIT the asynchronous conversion for the single amount
                const orderAmountRWF = await convertPrice(parseFloat(orderAmount), "USD", "RWF");
                
                return {
                    quantity: 1,
                    price_data: {
                        currency: "rwf",
                        unit_amount: Math.round(orderAmountRWF * 100),
                        product_data: {
                            name: `Order #${orderId}`,
                            description: `Payment for existing order`,
                            metadata: {
                                orderId: orderId || "",
                                isExistingOrder: "true",
                            },
                        },
                    },
                };
            })()
          ]
        : [];
    
    // AWAIT all currency conversions to complete
    const extractingItems = await Promise.all(lineItemsPromises);
    
    // --- End of Currency Conversion Update ---

    // Validate line items
    if (!extractingItems || extractingItems.length === 0) {
      throw new Error("No valid line items found");
    }

    // Validate each line item
    for (const item of extractingItems) {
      if (
        !item.price_data ||
        !item.price_data.unit_amount ||
        item.price_data.unit_amount <= 0
      ) {
        throw new Error(
          `Invalid price for item: ${item.price_data?.product_data?.name}`
        );
      }
    }

    // Calculate total amount in FRw
    const totalFRw = extractingItems.reduce(
      (sum: number, item: any) =>
        sum + (item.price_data.unit_amount * item.quantity) / 100,
      0
    );

    // AWAIT the asynchronous conversion for minimum check
    const totalUSD = await convertPrice(totalFRw, "RWF", "USD");

    // Stripe requires minimum 50 cents USD equivalent
    if (totalUSD < 0.5) {
        // AWAIT the asynchronous conversions for error message formatting
        const minAmountRWF = await convertPrice(0.5, "USD", "RWF");
        const minAmountFormatted = formatCurrency(0.5, "USD");
        const minAmountRWFFormatted = formatCurrency(minAmountRWF, "RWF");
        throw new Error(
          `The minimum order amount is ${minAmountRWFFormatted} (equivalent to ${minAmountFormatted}). Your total is ${formatCurrency(totalFRw, "RWF")} (≈${formatCurrency(totalUSD, "USD")}).`
        );
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: extractingItems,
      mode: "payment",
      success_url: `${
        process.env.NEXTAUTH_URL
      }/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId || ""}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/checkout${
        orderId ? `?orderId=${orderId}&cancelled=true` : "?cancelled=true"
      }`,
      metadata: {
        email,
        orderDate: new Date().toISOString(),
        itemCount: orderItems && orderItems.length > 0 ? orderItems.length.toString() : "1",
        orderAddress: orderAddress ? JSON.stringify(orderAddress) : "",
        orderId: orderId || "",
        orderAmount: orderTotal || "",
      },
      customer_email: email,
    });

// If existing order, update it for online payment
if (existingOrder) {
  const orderRef = adminDb.collection("orders").doc(orderId);
  await orderRef.update({
    paymentMethod: PAYMENT_METHODS.ONLINE,
    paymentStatus: PAYMENT_STATUSES.PENDING,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    paymentHistory: [
      ...(existingOrder.paymentHistory || []),
      {
        status: PAYMENT_STATUSES.PENDING,
        timestamp: new Date().toISOString(),
        updatedBy: email,
        userRole: "user",
        method: PAYMENT_METHODS.ONLINE,
        notes: "Stripe checkout session created",
      },
    ],
  });
}

    // Only create order if it's a new order (no orderId provided or order doesn't exist)
    if (!existingOrder) {
      // Generate orderId if not provided
      const finalOrderId = orderId || `ORD-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)
        .toUpperCase()}`;

// Create the order in the database
try {
  const orderRef = adminDb.collection("orders").doc(finalOrderId);
  await orderRef.set({
          id: finalOrderId,
          orderId: finalOrderId,
          email,
          items: extractingItems.map((item: any) => ({
            productId: item.price_data.product_data.metadata.productId,
            title: item.price_data.product_data.name,
            quantity: item.quantity,
            price: item.price_data.unit_amount / 100, // Convert back to original price in RWF
            image: item.price_data.product_data.images?.[0] || "",
          })),
          totalAmount:
            orderAmount ||
            Math.round(
              extractingItems.reduce(
                (sum: number, item: any) =>
                  sum + (item.price_data.unit_amount || 0) * (item.quantity || 1),
                0
              ) / 100
            ),
          orderAddress,
          customerName: email, // Will be updated when user data is available
          customerEmail: email,
          status: ORDER_STATUSES.PENDING,
          paymentStatus: PAYMENT_STATUSES.PENDING,
          paymentMethod: PAYMENT_METHODS.ONLINE,
userId: "", // Will be set when processing
createdAt: admin.firestore.FieldValue.serverTimestamp(),
updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          statusHistory: [
            {
              status: ORDER_STATUSES.PENDING,
              timestamp: new Date().toISOString(),
              updatedBy: email,
              userRole: "user",
              notes: "Order placed via online payment",
            },
          ],
          paymentHistory: [
            {
              status: PAYMENT_STATUSES.PENDING,
              timestamp: new Date().toISOString(),
              updatedBy: email,
              userRole: "user",
              method: PAYMENT_METHODS.ONLINE,
              notes: "Stripe checkout session created",
            },
          ],
        });
      } catch (error) {
        console.warn("Failed to create new order, but Stripe session was created:", error);
      }
    }

    return NextResponse.json({
      message: "Checkout session created successfully!",
      success: true,
      id: session?.id,
    });
  } catch (error: any) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
};