"use client";

import Container from "@/components/Container";
import OrderSummarySkeleton from "@/components/OrderSummarySkeleton";
import PriceFormat from "@/components/PriceFormat";
import RoleProtectedRoute from "@/components/auth/RoleProtectedRoute";
import { resetCart } from "@/redux/aweGiftSlice";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { useSession } from "next-auth/react";
import { PAYMENT_STATUSES, PAYMENT_METHODS } from "@/lib/orderStatus";

const SuccessPage = () => {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const orderId = searchParams.get("order_id");
  const dispatch = useDispatch();
  const { data: session } = useSession();
  const router = useRouter();
  const [orderProcessed, setOrderProcessed] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);

  useEffect(() => {
    if (!sessionId) {
      router.push("/");
    }
  }, [sessionId, router]);

  useEffect(() => {
    if (sessionId && session?.user?.email && !orderProcessed) {
      // Process the order and save to orders
      processOrder();
    }
  }, [sessionId, session?.user?.email, orderProcessed]);

  const processOrder = async () => {
    try {
      // If we have an order ID, update the payment status
      if (orderId) {
        const updateResponse = await fetch("/api/orders/update-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId,
            email: session?.user?.email,
            paymentStatus: PAYMENT_STATUSES.PAID,
            paymentMethod: PAYMENT_METHODS.ONLINE,
          }),
        });

        if (updateResponse.ok) {
          toast.success("Payment completed successfully!");
          setOrderProcessed(true);
          return;
        }
      }

      // Fallback to the original order processing for legacy orders
      const response = await fetch("/api/orders/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          email: session?.user?.email,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setOrderDetails(data.order);
        setOrderProcessed(true);
        dispatch(resetCart());
        toast.success("Order processed successfully!");
      } else {
        toast.error("Failed to process order");
      }
    } catch (error) {
      console.error("Error processing order:", error);
      toast.error("Error processing order");
    }
  };

  if (!orderProcessed) {
    return (
      <RoleProtectedRoute allowedRoles={["user", "admin"]} loadingMessage="Processing your order...">
        <Container className="py-10">
          <OrderSummarySkeleton />
        </Container>
      </RoleProtectedRoute>
    );
  }

  return (
    <RoleProtectedRoute allowedRoles={["user", "admin"]} loadingMessage="Processing your order...">
      <Container className="py-10">
        <div className="min-h-[500px] flex flex-col items-center justify-center">
          {/* Success Icon */}
          <div className="mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="w-10 h-10 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          {/* Success Message */}
          <div className="flex flex-col gap-3 items-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              🎉 Payment Successful!
            </h1>
            <p className="text-lg text-gray-600 mb-2">
              Thank you for your purchase from{" "}
              <span className="font-semibold text-theme-color">AweGift</span>
            </p>
            <p className="text-gray-500">
              Your order has been paid and you will receive an email of confirmation shortly
              after being confirmed.
            </p>

            {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link href="/account/orders">
                  <button className="bg-theme-color text-white px-8 py-3 rounded-md font-medium hover:bg-theme-color/90 transition-colors duration-200 w-52">
                    View My Orders
                  </button>
                </Link>
                <Link href="/products">
                  <button className="border border-gray-300 text-gray-700 px-8 py-3 rounded-md font-medium hover:bg-gray-50 transition-colors duration-200 w-52">
                    Continue Shopping
                  </button>
                </Link>
              </div>
          </div>

        </div>
      </Container>
    </RoleProtectedRoute>
  );
};

export default SuccessPage;
