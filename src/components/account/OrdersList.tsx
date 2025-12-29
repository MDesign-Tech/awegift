"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import PriceFormat from "@/components/PriceFormat";
import {
  FiEye,
  FiX,
  FiPackage,
  FiCalendar,
  FiCreditCard,
  FiTrash2,
} from "react-icons/fi";
import Link from "next/link";
import { OrderData, OrderItem } from "../../../type";
import { getStatusDisplayInfo, getPaymentStatusDisplayInfo, PAYMENT_METHODS } from "@/lib/orderStatus";

interface OrdersListProps {
  showHeader?: boolean;
  onOrdersChange?: (orders: OrderData[]) => void;
}

export default function OrdersList({
  showHeader = false,
  onOrdersChange,
}: OrdersListProps) {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (session?.user?.email) {
      fetchOrders();
    }
  }, [session?.user?.email]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/orders");

      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      const data = await response.json();
      if (data.orders && Array.isArray(data.orders)) {
        const sortedOrders = data.orders.sort(
          (a: OrderData, b: OrderData) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setOrders(sortedOrders);
        onOrdersChange?.(sortedOrders);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const dateObj = new Date(dateString);
      if (isNaN(dateObj.getTime())) {
        return "Invalid Date";
      }
      return dateObj.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  const openOrderModal = (order: OrderData) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const closeOrderModal = () => {
    setSelectedOrder(null);
    setIsModalOpen(false);
  };

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    setSelectedOrders(
      selectedOrders.length === orders.length
        ? []
        : orders.map((order) => order.id)
    );
  };

  const handleDeleteSelected = async () => {
    if (selectedOrders.length === 0) return;

    setIsDeleting(true);
    setShowDeleteConfirm(false);
    try {
      // Here you would implement the actual delete logic
      // For now, just filter out the selected orders
      const updatedOrders = orders.filter(
        (order) => !selectedOrders.includes(order.id)
      );
      setOrders(updatedOrders);
      setSelectedOrders([]);
      onOrdersChange?.(updatedOrders);

      // In a real app, you would call an API to delete the orders
      // await deleteOrders(selectedOrders);
    } catch (error) {
      console.error("Error deleting orders:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const OrderDetailsModal = () => {
    if (!selectedOrder || !isModalOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Background overlay */}
        <div
          className="absolute inset-0 bg-black/50 transition-opacity"
          onClick={closeOrderModal}
        ></div>

        {/* Modal */}
        <div className="relative w-full max-w-4xl bg-white shadow-xl rounded-lg overflow-hidden z-10 max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Order Details - {selectedOrder.id}
              </h3>
              <p className="text-sm text-gray-600">
                Placed on {formatDate(selectedOrder.createdAt)}
              </p>
            </div>
            <button
              onClick={closeOrderModal}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="px-6 py-4 max-h-96 overflow-y-auto">
            {/* Order Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FiPackage className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusDisplayInfo(selectedOrder.status).color}`}
                  >
                    {selectedOrder.status}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FiCreditCard className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="font-semibold text-gray-900">
                    <PriceFormat amount={selectedOrder.totalAmount} />
                  </p>
                </div>
              </div>

            </div>

            {/* Order Items */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Items ({selectedOrder.items.length})
              </h4>
              <div className="space-y-4">
                {selectedOrder.items.map((item, index) => (
                  <div
                    key={`${item.productId}-${index}`}
                    className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg"
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
                      <h5 className="font-medium text-gray-900 mb-1">
                        {item.title}
                      </h5>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>Quantity: {item.quantity}</span>
                        <span>
                          Unit Price: <PriceFormat amount={item.price} />
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

            {/* Payment Screenshot */}
            {selectedOrder.paymentScreenshot && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Payment Screenshot
                </h4>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <img
                    src={selectedOrder.paymentScreenshot}
                    alt="Payment Screenshot"
                    className="max-w-full h-auto rounded-lg shadow-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeOrderModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              {((selectedOrder.status === "confirmed" &&
                selectedOrder.paymentStatus === "paid") ||
                (selectedOrder.paymentMethod === "online" &&
                  selectedOrder.paymentStatus !== "pending") ||
                (selectedOrder.paymentMethod === "mtn" &&
                  selectedOrder.paymentStatus !== "pending") ||
                (selectedOrder.paymentMethod === "airtel" &&
                  selectedOrder.paymentStatus !== "pending")) && (
                  <Link
                    href={`/account/orders/${selectedOrder.id}`}
                    className="px-4 py-2 text-sm font-medium text-white bg-theme-color rounded-md hover:bg-theme-color/90 transition-colors"
                  >
                    Track Order
                  </Link>
                )}
              {selectedOrder.paymentStatus === "pending" &&
                (selectedOrder.paymentMethod === "mtn" ||
                  selectedOrder.paymentMethod === "airtel") &&
                !selectedOrder.paymentScreenshot && (
                  <Link
                    href={`/checkout?orderId=${selectedOrder.id}`}
                    className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 transition-colors"
                    title="Complete Payment"
                  >
                    Complete Payment
                  </Link>
                )}
              {selectedOrder.paymentStatus === "pending" &&
                (selectedOrder.paymentMethod === "mtn" ||
                  selectedOrder.paymentMethod === "airtel") &&
                selectedOrder.paymentScreenshot && (
                  <span
                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md"
                  >
                    Payment Under Review
                  </span>
                )}
              {selectedOrder.paymentStatus === "pending" &&
                selectedOrder.paymentMethod !== "mtn" &&
                selectedOrder.paymentMethod !== "airtel" && (
                  <Link
                    href={`/checkout?orderId=${selectedOrder.id}`}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                  >
                    Pay Now
                  </Link>
                )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {showHeader && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Order History</h2>
            <p className="text-gray-600">Track and manage your orders</p>
          </div>
        )}
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 bg-gray-200 rounded w-32"></div>
              <div className="h-6 bg-gray-200 rounded w-20"></div>
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-2">⚠️</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Error Loading Orders
        </h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchOrders}
          className="px-4 py-2 bg-theme-color text-white rounded-lg hover:bg-theme-color/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        {showHeader && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Order History</h2>
            <p className="text-gray-600">Track and manage your orders</p>
          </div>
        )}
        <div className="text-6xl mb-4">🛍️</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Orders Yet
        </h3>
        <p className="text-gray-600 mb-6">
          Looks like you haven&apos;t placed any orders yet. Start shopping to
          see your orders here.
        </p>
        <Link
          href="/products"
          className="inline-block px-6 py-3 bg-theme-color text-white rounded-lg hover:bg-theme-color/90 transition-colors"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0">
      {showHeader && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Order History</h2>
          <p className="text-gray-600">
            {orders.length} order{orders.length !== 1 ? "s" : ""} found
          </p>
        </div>
      )}

      {/* Delete Selected Button */}
      {selectedOrders.length > 0 && (
        <div className="mb-4 flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-sm text-blue-700">
              {selectedOrders.length} order
              {selectedOrders.length !== 1 ? "s" : ""} selected
            </span>
          </div>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isDeleting}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
          >
            <FiTrash2 className="w-4 h-4 mr-2" />
            {isDeleting
              ? "Deleting..."
              : `Delete Selected (${selectedOrders.length})`}
          </button>
        </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden lg:block w-full max-w-7xl mx-auto">
        <div className="bg-white shadow ring-1 ring-black ring-opacity-5 rounded-lg w-full">
          <table className="w-full divide-y divide-gray-300 table-fixed">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left w-12">
                  <input
                    type="checkbox"
                    checked={
                      selectedOrders.length === orders.length &&
                      orders.length > 0
                    }
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                  Order
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                  Date
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                  Items
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                  Status
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                  Total
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className={`hover:bg-gray-50 ${selectedOrders.includes(order.id) ? "bg-blue-50" : ""
                    }`}
                >
                  <td className="px-3 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedOrders.includes(order.id)}
                      onChange={() => handleSelectOrder(order.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 truncate">
                        #{order.id}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        User ID: {order.userId}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(order.createdAt)}
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div className="flex -space-x-1 overflow-hidden flex-shrink-0">
                        {order.items.slice(0, 2).map((item, index) => (
                          <div
                            key={index}
                            className="inline-block h-6 w-6 rounded-full ring-2 ring-white overflow-hidden flex-shrink-0"
                          >
                            {item.thumbnail ? (
                              <img
                                src={item.thumbnail}
                                alt={item.title}
                                className="h-6 w-6 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-6 w-6 bg-gray-300 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium text-gray-600">
                                  {item.title?.charAt(0)?.toUpperCase() || "P"}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <span className="text-xs text-gray-600 truncate">
                        {order.items.length}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusDisplayInfo(order.status).color}`}
                    >
                      {order.status}
                    </span>
                    <div className="text-xs text-gray-500 mt-1 truncate">
                      {order.paymentStatus}
                      {order.paymentMethod && ` • ${order.paymentMethod}`}
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      <PriceFormat amount={order.totalAmount} />
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex flex-col space-y-1">
                      <button
                        onClick={() => openOrderModal(order)}
                        className="inline-flex items-center justify-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                        title="View Details"
                      >
                        <FiEye className="w-3 h-3" />
                      </button>
                      {((order.status === "confirmed" &&
                        order.paymentStatus === "paid") ||
                        (order.paymentMethod === "online" &&
                          order.paymentStatus !== "pending") ||
                        (order.paymentMethod === "mtn" &&
                          order.paymentStatus !== "pending") ||
                        (order.paymentMethod === "airtel" &&
                          order.paymentStatus !== "pending")) && (
                          <Link
                            href={`/account/orders/${order.id}`}
                            className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                            title="Track Order"
                          >
                            Track
                          </Link>
                        )}
                      {order.paymentStatus === "pending" &&
                        (order.paymentMethod === "mtn" ||
                          order.paymentMethod === "airtel") &&
                        !order.paymentScreenshot && (
                          <Link
                            href={`/checkout?orderId=${order.id}`}
                            className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 transition-colors"
                            title="Complete Payment"
                          >
                            Complete Payment
                          </Link>
                        )}
                      {order.paymentStatus === "pending" &&
                        (order.paymentMethod === "mtn" ||
                          order.paymentMethod === "airtel") &&
                        order.paymentScreenshot && (
                          <span
                            className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded text-gray-600 bg-gray-100"
                            title="Payment Under Review"
                          >
                            Review
                          </span>
                        )}
                      {order.paymentStatus === "pending" &&
                        order.paymentMethod !== "mtn" &&
                        order.paymentMethod !== "airtel" && (
                          <Link
                            href={`/checkout?orderId=${order.id}`}
                            className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 transition-colors"
                            title="Go to choose Payment method"
                          >
                            Pay
                          </Link>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4 w-full">
        {orders.map((order) => (
          <div
            key={order.id}
            className={`bg-white rounded-lg shadow border border-gray-200 p-4 ${selectedOrders.includes(order.id)
              ? "ring-2 ring-blue-500 bg-blue-50"
              : ""
              }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={selectedOrders.includes(order.id)}
                  onChange={() => handleSelectOrder(order.id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    #{order.id}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {formatDate(order.createdAt)}
                  </p>
                </div>
              </div>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusDisplayInfo(order.status).color}`}
              >
                {order.status}
              </span>
            </div>

            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="flex -space-x-1 overflow-hidden">
                  {order.items.slice(0, 2).map((item, index) => (
                    <div
                      key={index}
                      className="inline-block h-6 w-6 rounded-full ring-1 ring-white overflow-hidden"
                    >
                      {item.thumbnail ? (
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="h-6 w-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-6 w-6 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-600">
                            {item.title?.charAt(0)?.toUpperCase() || "P"}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <span className="text-xs text-gray-600">
                  {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  <PriceFormat amount={order.totalAmount} />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
              <div className="text-xs text-gray-500">
                Payment: {order.paymentStatus}
              </div>
              <div className="flex flex-wrap gap-2 justify-end">
                <button
                  onClick={() => openOrderModal(order)}
                  className="flex items-center justify-center px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors whitespace-nowrap"
                >
                  <FiEye className="w-3 h-3 mr-1" />
                  View
                </button>
                {(order.status === "confirmed" &&
                  order.paymentStatus === "paid") ||
                  (order.paymentMethod === "online" &&
                    order.paymentStatus !== "pending") ||
                  (order.paymentMethod === "mtn" &&
                    order.paymentStatus !== "pending") ||
                  (order.paymentMethod === "airtel" &&
                    order.paymentStatus !== "pending") ? (
                  <Link
                    href={`/account/orders/${order.id}`}
                    className="flex items-center justify-center px-3 py-1 text-xs bg-theme-color text-white rounded hover:bg-theme-color/90 transition-colors whitespace-nowrap"
                  >
                    Track
                  </Link>
                ) : null}
                {order.paymentStatus === "pending" &&
                  (order.paymentMethod === "mtn" ||
                    order.paymentMethod === "airtel") &&
                  !order.paymentScreenshot && (
                    <Link
                      href={`/checkout?orderId=${order.id}`}
                      className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 transition-colors"
                      title="Complete Payment"
                    >
                      Complete Payment
                    </Link>
                  )}
                {order.paymentStatus === "pending" &&
                  (order.paymentMethod === "mtn" ||
                    order.paymentMethod === "airtel") &&
                  order.paymentScreenshot && (
                    <span
                      className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded text-gray-600 bg-gray-100"
                      title="Payment Under Review"
                    >
                      Review
                    </span>
                  )}
                {order.paymentStatus === "pending" &&
                  order.paymentMethod !== "mtn" &&
                  order.paymentMethod !== "airtel" && (
                    <Link
                      href={`/checkout?orderId=${order.id}`}
                      className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 transition-colors"
                      title="Complete Payment"
                    >
                      Pay
                    </Link>
                  )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Order Details Modal */}
      <OrderDetailsModal />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowDeleteConfirm(false)}
          ></div>
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
              <FiTrash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
              Delete Selected Orders
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Are you sure you want to delete {selectedOrders.length} order
              {selectedOrders.length !== 1 ? "s" : ""}? This action cannot be
              undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSelected}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
