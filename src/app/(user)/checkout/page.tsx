"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Container from "@/components/Container";
import PriceFormat from "@/components/PriceFormat";
import { loadStripe } from "@stripe/stripe-js";
import RoleProtectedRoute from "@/components/auth/RoleProtectedRoute";
import { OrderData } from "../../../../type";
import {
  FiPackage,
  FiMapPin,
  FiCreditCard,
  FiArrowLeft,
  FiLoader,
  FiTruck,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import Link from "next/link";
import { PAYMENT_METHODS, PAYMENT_STATUSES } from "@/lib/orderStatus";

const CheckoutPage = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [existingOrder, setExistingOrder] = useState<OrderData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"online" | "MTN" | "AIRTEL" | null>(
    null
  );
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [paymentError, setPaymentError] = useState<{
    message: string;
    code?: string;
    canRetry: boolean;
  } | null>(null);

  // Get order ID from URL params
  const existingOrderId = searchParams.get("orderId");
  const paymentCancelled = searchParams.get("cancelled");

  useEffect(() => {
    // Always expect an order ID for this new flow
    if (existingOrderId) {
      fetchExistingOrder();
    } else {
      // Redirect to cart if no order ID
      router.push("/cart");
    }
  }, [existingOrderId, router]);

  // Clean up cancelled parameter from URL after showing notification
  useEffect(() => {
    if (paymentCancelled) {
      const timer = setTimeout(() => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("cancelled");
        const newUrl = `/checkout?orderId=${existingOrderId}`;
        router.replace(newUrl);
      }, 5000); // Remove after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [paymentCancelled, existingOrderId, searchParams, router]);

  const fetchExistingOrder = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${existingOrderId}`);

      if (!response.ok) {
        throw new Error("Order not found");
      }

      const data = await response.json();
      setExistingOrder(data.order);

    } catch (error) {
      console.error("Error fetching order:", error);
      // On error, redirect to orders page
      router.push("/account/orders");
    } finally {
      setLoading(false);
    }
  };

  const handleMobilePayment = async () => {
    try {
      setPaymentProcessing(true);

      if (!existingOrder || !paymentMethod || !paymentScreenshot) return;

      // Upload screenshot to Cloudinary
        const formData = new FormData();
        formData.append('file', paymentScreenshot);
        formData.append('upload_preset', 'default_unsigned');
        formData.append('folder', 'payment_screenshots');

        const cloudinaryResponse = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!cloudinaryResponse.ok) {
          throw new Error('Failed to upload screenshot');
        }

        const cloudinaryData = await cloudinaryResponse.json();
      const screenshotUrl = cloudinaryData.secure_url;

      // Update order with payment method and screenshot
      const response = await fetch("/api/orders/update-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: existingOrder.id,
          paymentStatus: PAYMENT_STATUSES.PENDING,
          paymentMethod: paymentMethod.toLowerCase(),
          paymentScreenshot: screenshotUrl,
        }),
      });

      if (response.ok) {
        // Redirect to order details page
        router.push(`/account/orders/${existingOrder.id}`);
      } else {
        throw new Error("Failed to update order");
      }
    } catch (error) {
      console.error("Error processing mobile payment:", error);
      alert("Failed to process payment. Please try again.");
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleOnlinePayment = async () => {
    if (!existingOrder) return;

    try {
      setPaymentProcessing(true);
      setPaymentError(null);

      const stripe = await loadStripe(
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
      );

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: existingOrder.items,
          email: session?.user?.email,
          orderAddress: existingOrder.orderAddress,
          orderId: existingOrder.id,
          orderAmount: existingOrder.totalAmount,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Checkout API error:", errorData);

        // Handle specific error codes
        if (errorData.code === "CUSTOMER_UNTRUSTED") {
          setPaymentError({
            message: errorData.error,
            code: errorData.code,
            canRetry: false, // Don't allow retry for untrusted customer
          });
          return;
        }

        throw new Error(errorData.error || "Failed to create checkout session");
      }

      const checkoutSession = await response.json();

      if (!checkoutSession.id) {
        throw new Error("No session ID returned from checkout");
      }

      const result: any = await (stripe as any)?.redirectToCheckout({
        sessionId: checkoutSession.id,
      });

      if (result.error) {
        console.error("Stripe redirect error:", result.error);
        setPaymentError({
          message: result.error.message,
          canRetry: true,
        });
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      setPaymentError({
        message: error instanceof Error ? error.message : "Payment processing failed. Please try again.",
        canRetry: true,
      });
    } finally {
      setPaymentProcessing(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-8">
        <div className="flex items-center justify-center min-h-96">
          <FiLoader className="animate-spin text-4xl text-theme-color" />
          <span className="ml-4 text-lg">Loading order details...</span>
        </div>
      </Container>
    );
  }

  if (!session?.user) {
    return (
      <Container className="py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Please Sign In
          </h1>
          <p className="text-gray-600 mb-6">
            You need to be signed in to complete your order.
          </p>
          <Link
            href="/auth/signin"
            className="bg-theme-color text-white px-6 py-3 rounded-lg hover:bg-theme-color/90 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </Container>
    );
  }

  if (!existingOrder) {
    return (
      <Container className="py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Order not found
          </h1>
          <p className="text-gray-600 mb-6">
            The order you&apos;re looking for could not be found.
          </p>
          <Link
            href="/account/orders"
            className="bg-theme-color text-white px-6 py-3 rounded-lg hover:bg-theme-color/90 transition-colors"
          >
            View Orders
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <RoleProtectedRoute allowedRoles={["user", "admin"]} loadingMessage="Loading checkout...">
      <Container className="py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link
              href="/account/orders"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FiArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Order #{existingOrder?.id}
              </h1>
              <p className="text-gray-600">
                Choose your payment method
              </p>
            </div>
          </div>
        </div>

        {/* Payment Cancelled Notification */}
        {paymentCancelled && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Payment Cancelled
                </h3>
                <div className="mt-1 text-sm text-yellow-700">
                  <p>
                    Your payment was cancelled. You can try the payment again
                    when you&apos;re ready.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Error Notification */}
        {paymentError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800">
                  Payment Error
                </h3>
                <div className="mt-1 text-sm text-red-700">
                  <p>{paymentError.message}</p>
                  {paymentError.code === "CUSTOMER_UNTRUSTED" && (
                    <div className="mt-3 space-y-2">
                      <p className="text-sm">
                        Please contact our support team for assistance:
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <a
                          href="mailto:support@awegift.com"
                          className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          Email Support
                        </a>
                        <a
                          href="https://wa.me/256790651889"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          WhatsApp Support
                        </a>
                      </div>
                    </div>
                  )}
                  {paymentError.canRetry && (
                    <div className="mt-3">
                      <button
                        onClick={() => {
                          setPaymentError(null);
                          setPaymentMethod(null);
                        }}
                        className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Try Different Payment Method
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Items */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FiPackage className="w-5 h-5 mr-2" />
                Order Items ({existingOrder?.items?.length || 0})
              </h3>

              <div className="space-y-4">
                {existingOrder?.items?.map((item: any, index: number) => (
                  <div
                    key={`order-${item.id}-${index}`}
                    className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex-shrink-0">
                      {item.thumbnail ? (
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gray-300 rounded-lg flex items-center justify-center">
                          <span className="text-lg font-medium text-gray-600">
                            {item.title?.charAt(0)?.toUpperCase() || "P"}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">
                        {item.title}
                      </h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>Qty: {item.quantity}</span>
                        <span>
                          <PriceFormat amount={item.price} />
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        <PriceFormat amount={item.price * item.quantity} />
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FiMapPin className="w-5 h-5 mr-2" />
                Delivery Address
              </h3>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900">
                  {session?.user?.name || "Customer"}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {existingOrder?.orderAddress?.address}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Options & Order Summary */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FiCreditCard className="w-5 h-5 mr-2" />
                Order Summary
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Amount</span>
                  <PriceFormat
                    amount={existingOrder?.totalAmount || 0}
                    className="font-semibold text-theme-color"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Selection or Order Confirmation */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Choose Payment Method
              </h3>

              <div className="space-y-3">
                {/* Online Payment */}
                <div
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${paymentMethod === "online"
                      ? "border-theme-color bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                    }`}
                  onClick={() => setPaymentMethod("online")}
                >
                  <div className="flex items-center">
                    <FiCreditCard className="w-5 h-5 mr-3 text-gray-600" />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        Online Payment
                      </h4>
                      <p className="text-sm text-gray-600">
                        Secure payment via card
                      </p>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border-2 ${paymentMethod === "online"
                          ? "border-theme-color bg-theme-color"
                          : "border-gray-300"
                        }`}
                    >
                      {paymentMethod === "online" && (
                        <div className="w-full h-full rounded-full bg-white scale-50"></div>
                      )}
                    </div>
                  </div>
                </div>

                {/* MTN Momo */}
                <div
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${paymentMethod === "MTN"
                      ? "border-theme-color bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                    }`}
                  onClick={() => setPaymentMethod("MTN")}
                >
                  <div className="flex items-center">
                    <div className="w-5 h-5 mr-3 bg-yellow-500 rounded text-white text-xs flex items-center justify-center font-bold">
                      M
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        MTN
                      </h4>
                      <p className="text-sm text-gray-600">
                        Pay via MTN Mobile Money / MoMo pay
                      </p>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border-2 ${paymentMethod === "MTN"
                          ? "border-theme-color bg-theme-color"
                          : "border-gray-300"
                        }`}
                    >
                      {paymentMethod === "MTN" && (
                        <div className="w-full h-full rounded-full bg-white scale-50"></div>
                      )}
                    </div>
                  </div>
                </div>

                {/* AIRTEL */}
                <div
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${paymentMethod === "AIRTEL"
                      ? "border-theme-color bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                    }`}
                  onClick={() => setPaymentMethod("AIRTEL")}
                >
                  <div className="flex items-center">
                    <div className="w-5 h-5 mr-3 bg-red-500 rounded text-white text-xs flex items-center justify-center font-bold">
                      A
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        Airtel
                      </h4>
                      <p className="text-sm text-gray-600">
                        Pay via Airtel Money
                      </p>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border-2 ${paymentMethod === "AIRTEL"
                          ? "border-theme-color bg-theme-color"
                          : "border-gray-300"
                        }`}
                    >
                      {paymentMethod === "AIRTEL" && (
                        <div className="w-full h-full rounded-full bg-white scale-50"></div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Instructions and Action */}
              <div className="mt-6">
                {paymentMethod === "online" ? (
                  <button
                    onClick={handleOnlinePayment}
                    disabled={paymentProcessing}
                    className="w-full bg-theme-color text-white py-3 px-4 rounded-lg hover:bg-theme-color/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {paymentProcessing ? (
                      <>
                        <FiLoader className="animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      "Pay Online"
                    )}
                  </button>
                ) : (paymentMethod === "MTN" || paymentMethod === "AIRTEL") ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">
                        Payment Instructions
                      </h4>
                      <div className="text-sm text-blue-800 space-y-1">
                        {paymentMethod === "MTN" ? (
                          <>
                          <p>
                          Pay via Mobile Money (*182*1*1*0790651889*{existingOrder?.totalAmount || 0}#)
                        </p>
                        <p>
                          Pay via MoMo pay (*182*8*1*757537*{existingOrder?.totalAmount || 0}#)
                        </p>
                          </>
                        ) : (
                          <p>
                            Pay via AIRTEL Money (*180*1*1*0790651889*{existingOrder?.totalAmount || 0}#)
                          </p>
                        )}
                        <p className="mt-2">
                          Please share screenshot of payment message to WhatsApp or upload it below.
                        </p>
                        <div className="mt-3 flex items-center space-x-2">
                          <FaWhatsapp className="text-green-600 w-5 h-5" />
                          <a
                            href={`https://wa.me/256790651889?text=I%20have%20finished%20to%20pay`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-700 font-medium underline"
                          >
                            Send WhatsApp Message
                          </a>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload Payment Screenshot *
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setPaymentScreenshot(e.target.files?.[0] || null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-theme-color"
                      />
                    </div>

                    <button
                      onClick={handleMobilePayment}
                      disabled={paymentProcessing || !paymentScreenshot}
                      className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {paymentProcessing  ? (
                        <>
                          <FiLoader className="animate-spin mr-2" />
                          Processing...
                        </>
                      ) : (
                        "Submit Payment"
                      )}
                    </button>
                  </div>
                ) : (
                  <button
                    disabled
                    className="w-full bg-gray-300 text-gray-500 py-3 px-4 rounded-lg cursor-not-allowed"
                  >
                    Select Payment Method
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </RoleProtectedRoute>
  );
};

export default CheckoutPage;

