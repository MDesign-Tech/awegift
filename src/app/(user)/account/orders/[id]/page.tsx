"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Container from "@/components/Container";
import PriceFormat from "@/components/PriceFormat";
import RoleProtectedRoute from "@/components/auth/RoleProtectedRoute";
import Button from "@/components/ui/Button";
import Receipt from "@/components/Receipt";
import Link from "next/link";
import { OrderData } from "../../../../../../type";
import { getStatusDisplayInfo } from "@/lib/orderStatus";
import {
  FiPackage,
  FiTruck,
  FiMapPin,
  FiCalendar,
  FiCreditCard,
  FiArrowLeft,
  FiPhone,
  FiMail,
  FiCheckCircle,
  FiLoader,
} from "react-icons/fi";

const OrderTrackingPage = () => {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const orderId = params.id as string;

  useEffect(() => {
    if (session?.user?.email && orderId) {
      fetchOrderDetails();
    }
  }, [session?.user?.email, orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${orderId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(
            `Order ${orderId} not found. It may not exist or you may not have permission to view it.`
          );
        }
        throw new Error("Failed to fetch order details");
      }

      const data = await response.json();

      if (data.order) {
        setOrder(data.order);
      } else {
        throw new Error(
          `Order ${orderId} not found. It may not exist or you may not have permission to view it.`
        );
      }
    } catch (err) {
      console.error("Error fetching order:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load order details"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleMarkCompleted = async () => {
    if (!order) return;

    try {
      setUpdatingStatus(true);
      const response = await fetch("/api/orders/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: order.id,
          status: "completed",
        }),
      });

      if (response.ok) {
        // Refresh order data
        fetchOrderDetails();
      } else {
        throw new Error("Failed to update order status");
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Failed to mark order as completed. Please try again.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // No changes needed to the Tracking Page structure,
  // just ensure the handleGenerateReceipt passes the promise:

  const handleGenerateReceipt = async () => {
    if (!order) return;
    const response = await fetch("/api/orders/generate-receipt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to generate receipt");
    }

    await fetchOrderDetails(); // Refresh UI
  };

  if (loading) {
    return (
      <RoleProtectedRoute
        allowedRoles={["user", "admin"]}
        loadingMessage="Loading order details..."
      >
        <Container className="py-8">
          <div className="animate-pulse">
            <div className="bg-gray-200 rounded h-8 w-64 mb-8"></div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="space-y-4">
                <div className="bg-gray-200 rounded h-6 w-48"></div>
                <div className="bg-gray-200 rounded h-4 w-full"></div>
                <div className="bg-gray-200 rounded h-4 w-3/4"></div>
              </div>
            </div>
          </div>
        </Container>
      </RoleProtectedRoute>
    );
  }

  if (error || !order) {
    return (
      <RoleProtectedRoute
        allowedRoles={["user", "admin"]}
        loadingMessage="Loading order details..."
      >
        <Container className="py-8">
          <div className="text-center">
            <div className="text-6xl mb-4">📦</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Order Not Found
            </h1>
            <p className="text-gray-600 mb-6">
              {error ||
                "The order you're looking for doesn't exist or you don't have permission to view it."}
            </p>
            <Link
              href="/account/orders"
              className="inline-flex items-center px-4 py-2 bg-theme-color text-white rounded-lg hover:bg-theme-color/90 transition-colors"
            >
              <FiArrowLeft className="w-4 h-4 mr-2" />
              Back to Account
            </Link>
          </div>
        </Container>
      </RoleProtectedRoute>
    );
  }

  // Simple tracking steps based on order status
  const trackingSteps = [
    {
      id: "pending",
      label: "Order Placed",
      completed: true,
      active: order.status === "pending",
      icon: FiPackage,
    },
    {
      id: "confirmed",
      label: "Order Confirmed",
      completed: ["confirmed", "ready", "completed"].includes(order.status),
      active: order.status === "confirmed",
      icon: FiCheckCircle,
    },
    {
      id: "ready",
      label: "Ready for Delivery",
      completed: ["ready", "completed"].includes(order.status),
      active: order.status === "ready",
      icon: FiPackage,
    },
    {
      id: "completed",
      label: "Order Completed",
      completed: order.status === "completed",
      active: false,
      icon: FiCheckCircle,
    },
  ];

  return (
    <RoleProtectedRoute
      allowedRoles={["user", "admin"]}
      loadingMessage="Loading order details..."
    >
      <Container className="lg:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <Link
                href="/account"
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FiArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                  Order #{order.id}
                </h1>
                <p className="text-gray-600 text-sm md:text-base">
                  Placed on {formatDate(order.createdAt)}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <Receipt
                orderId={order.id}
                receiptPath={order.receiptPath}
                onGenerateReceipt={handleGenerateReceipt}
              />
              <div
                className={`px-4 py-2 text-sm font-medium rounded-lg border capitalize cursor-default w-full sm:w-auto ${
                  getStatusDisplayInfo(order.status).color
                }`}
              >
                {order.status}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Tracking */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Order Tracking
              </h3>

              <div className="relative">
                {trackingSteps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div
                      key={step.id}
                      className="relative flex items-center mb-8 last:mb-0"
                    >
                      {/* Connector Line */}
                      {index < trackingSteps.length - 1 && (
                        <div
                          className={`absolute left-6 top-12 w-0.5 h-16 ${
                            step.completed ? "bg-green-500" : "bg-gray-200"
                          }`}
                        />
                      )}

                      {/* Step Icon */}
                      <div
                        className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                          step.completed
                            ? "bg-green-500 border-green-500 text-white"
                            : step.active
                            ? "bg-blue-500 border-blue-500 text-white"
                            : "bg-white border-gray-300 text-gray-400"
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>

                      {/* Step Content */}
                      <div className="ml-4 flex-1">
                        <h4
                          className={`font-medium ${
                            step.completed || step.active
                              ? "text-gray-900"
                              : "text-gray-500"
                          }`}
                        >
                          {step.label}
                        </h4>
                        {step.active && (
                          <p className="text-sm text-gray-600 mt-1">
                            Your order is currently being{" "}
                            {step.label.toLowerCase()}
                          </p>
                        )}
                        {step.completed && index === 0 && (
                          <p className="text-sm text-gray-600 mt-1">
                            {formatDate(order.createdAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {order.paymentScreenshot && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">
                    Payment Screenshot
                  </h4>
                  <img
                    src={order.paymentScreenshot}
                    alt="Payment Screenshot"
                    className="max-w-full h-auto rounded"
                  />
                </div>
              )}
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Items ({order.items.length})
              </h3>

              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div
                    key={`${item.productId}-${index}`}
                    className="flex items-center flex-wrap space-x-4 p-4 border border-gray-200 rounded-lg"
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

                    <div className="flex-1 ">
                      <h4 className="font-medium text-gray-900 mb-1">
                        {item.title}
                      </h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>Quantity: {item.quantity}</span>
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
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Order Summary
              </h3>

              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <FiCreditCard className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="font-semibold">
                      <PriceFormat amount={order.totalAmount} />
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <FiCheckCircle className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Payment Status</p>
                    <p className="font-medium capitalize text-green-600">
                      {order.paymentStatus}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <FiCalendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Order Date</p>
                    <p className="font-medium">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Mark as Completed Button */}
              {order.status === "ready" && order.paymentStatus === "paid" && (
                <div className="mt-4 pt-4 border-t">
                  <button
                    onClick={handleMarkCompleted}
                    disabled={updatingStatus}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {updatingStatus ? (
                      <>
                        <FiLoader className="animate-spin mr-2" />
                        Updating...
                      </>
                    ) : (
                      "Mark as Completed"
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Order Location */}
            {order.orderAddress && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Order Location
                </h3>

                <div className="flex items-start space-x-3">
                  <FiMapPin className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {session?.user?.name || "Customer"}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {order.orderAddress.address}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Contact Support */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Need Help?
              </h3>

              <div className="space-y-3">
                <button className="flex items-center space-x-3 w-full p-3 text-left bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <FiPhone className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">Call Support</p>
                    <p className="text-sm text-gray-600">+250 781 990 310</p>
                  </div>
                </button>

                <button className="flex items-center space-x-3 w-full p-3 text-left bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <FiMail className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">Email Support</p>
                    <p className="text-sm text-gray-600">support@awegift.com</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </RoleProtectedRoute>
  );
};

export default OrderTrackingPage;
