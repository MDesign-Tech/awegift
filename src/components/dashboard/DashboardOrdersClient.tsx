"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { TableSkeleton } from "./Skeletons";
import { toast } from "react-hot-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { hasPermission, UserRole } from "@/lib/rbac/roles";
import { canUpdateOrderStatus, OrderStatus, getNextPossibleStatuses, getStatusDisplayInfo, getPaymentStatusDisplayInfo, ORDER_STATUSES, PAYMENT_STATUSES, PaymentStatus, PaymentMethod } from "@/lib/orderStatus";
import { useInfiniteOrders, useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import {
  FiPackage,
  FiX,
  FiEdit2,
  FiRefreshCw,
  FiTrash2,
  FiSave,
  FiSearch,
  FiEye,
  FiLoader,
} from "react-icons/fi";

import PriceFormat from "@/components/PriceFormat";
import { OrderData, Address, OrderItem, OrderStatusHistory } from '../../../type';


export default function DashboardOrdersClient() {
  const { data: session } = useSession();
  const { user, isAdmin, userRole } = useCurrentUser();
  const [editingOrder, setEditingOrder] = useState<OrderData | null>(null);
  const [editingPayment, setEditingPayment] = useState<OrderData | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [newPaymentStatus, setNewPaymentStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [deliveryNote, setDeliveryNote] = useState("");
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Use the infinite orders hook
  const {
    orders: allOrders,
    loading: initialLoading,
    loadingMore,
    hasMore,
    loadMore,
    reset: resetOrders,
    refetch: refetchOrders,
  } = useInfiniteOrders("/api/admin/orders", 20, debouncedSearchTerm || undefined, statusFilter, paymentFilter);

  // Modal states
  const [viewOrderModal, setViewOrderModal] = useState<OrderData | null>(null);
  const [deleteOrderModal, setDeleteOrderModal] = useState<OrderData | null>(null);
  const [deleteAllModal, setDeleteAllModal] = useState(false);
  const [deleteSelectedModal, setDeleteSelectedModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Selected orders state
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Ref for scrollable container
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Infinite scroll setup
  useInfiniteScroll(loadMore, hasMore, loadingMore || initialLoading, scrollContainerRef);

  // Handle refresh with loading state
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetchOrders();
      toast.success("Orders refreshed successfully");
    } catch (error) {
      if (error instanceof TypeError || (error as Error).message.includes('Failed to fetch')) {
        toast.error('Network connection error');
      } else {
        toast.error("Failed to refresh orders");
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Reset selection when filters change
  useEffect(() => {
    setSelectedOrders([]);
    setSelectAll(false);
  }, [debouncedSearchTerm, statusFilter, paymentFilter]);

  // Update selectAll state based on selected orders
  useEffect(() => {
    if (allOrders.length > 0) {
      // Check if all visible orders are selected
      const allVisibleSelected = allOrders.every(order =>
        selectedOrders.includes(order.id)
      );
      setSelectAll(allVisibleSelected);
    } else {
      setSelectAll(false);
    }
  }, [selectedOrders, allOrders]);

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      setUpdatingOrder(orderId);
      // Find the order to get current status
      const order = allOrders.find(o => o.id === orderId);
      if (!order) {
        toast.error("Order not found");
        return;
      }

      // Check if user has permission to change order status
      if (!hasPermission(userRole as UserRole, "canChangeOrderStatus")) {
        toast.error("You don't have permission to change order status");
        return;
      }

      // Validate status transition using RBAC
      if (!canUpdateOrderStatus(userRole, order.status, status as OrderStatus)) {
        toast.error(`You don't have permission to change status from ${order.status} to ${status}`);
        return;
      }

      const response = await fetch("/api/admin/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status }),
      });

      if (response.ok) {
        toast.success(`Order status updated to ${status}`);
        await refetchOrders();
        setEditingOrder(null);
        setNewStatus("");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update order status");
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Error updating order status");
    } finally {
      setUpdatingOrder(null);
    }
  };

  const handleUpdatePaymentStatus = async (
    orderId: string,
    paymentStatus: string
  ) => {
    try {
      setUpdatingOrder(orderId);
      // Check if user has permission to process payments
      if (!hasPermission(userRole as UserRole, "canProcessPayments")) {
        toast.error("You don't have permission to update payment status");
        return;
      }

      const response = await fetch("/api/admin/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, paymentStatus }),
      });

      if (response.ok) {
        toast.success(`Payment status updated to ${paymentStatus}`);
        await refetchOrders();
        setEditingPayment(null);
        setNewPaymentStatus("");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update payment status");
      }
    } catch (error) {
      console.error("Error updating payment status:", error);
      toast.error("Error updating payment status");
    } finally {
      setUpdatingOrder(null);
    }
  };

  const handleDeleteOrder = async (order: OrderData) => {
    setDeleteOrderModal(order);
  };

  const confirmDeleteOrder = async () => {
    if (!deleteOrderModal) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/orders/${deleteOrderModal.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Order deleted successfully");
        await refetchOrders();
        setDeleteOrderModal(null);
      } else {
        const errorData = await response.json();
if (response.status === 401 && errorData.code === 'USER_DELETED') {
  toast.error('Account deleted');
}
 toast.error(errorData.error || "Failed to delete order");
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error("Error deleting order");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAllOrders = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch("/api/admin/orders/bulk-delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        toast.success("All orders deleted successfully");
        await refetchOrders();
        setDeleteAllModal(false);
      } else {
        const errorData = await response.json();
if (response.status === 401 && errorData.code === 'USER_DELETED') {
  toast.error('Account deleted');
}
 toast.error(errorData.error || "Failed to delete all orders");
      }
    } catch (error) {
      console.error("Error deleting all orders:", error);
      toast.error("Error deleting all orders");
    } finally {
      setIsDeleting(false);
    }
  };

  // Selection handlers
  const handleSelectOrder = (orderId: string) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  // Handle select all visible orders
  const handleSelectAll = () => {
    if (selectAll) {
      // Deselect all visible orders
      const visibleIds = allOrders.map(order => order.id);
      setSelectedOrders(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      // Select all visible orders
      const visibleIds = allOrders.map(order => order.id);
      const newSelected = [...new Set([...selectedOrders, ...visibleIds])];
      setSelectedOrders(newSelected);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedOrders.length === 0) {
      toast.error("Please select orders to delete");
      return;
    }
    setDeleteSelectedModal(true);
  };

  const confirmDeleteSelected = async () => {
    if (selectedOrders.length === 0) return;

    setIsDeleting(true);
    try {
      const response = await fetch("/api/admin/orders/bulk-delete-selected", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderIds: selectedOrders }),
      });

      if (response.ok) {
        toast.success(`Successfully deleted ${selectedOrders.length} orders`);
        setSelectedOrders([]);
        setSelectAll(false);
        await refetchOrders();
        setDeleteSelectedModal(false);
      } else {
        const errorData = await response.json();
if (response.status === 401 && errorData.code === 'USER_DELETED') {
  toast.error('Account deleted');
}
 toast.error(errorData.error || "Failed to delete selected orders");
      }
    } catch (error) {
      console.error("Error deleting selected orders:", error);
      toast.error("Error deleting selected orders");
    } finally {
      setIsDeleting(false);
    }
  };

  // Show loading skeleton for initial load and refresh
  if (initialLoading || isRefreshing) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {isRefreshing ? "Refreshing Orders..." : "Loading Orders..."}
            </h2>
          </div>
        </div>
        <TableSkeleton rows={10} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900">
              Orders Management ({allOrders.length}{hasMore ? '+' : ''})
            </h2>
            {selectedOrders.length > 0 && (
              <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                {selectedOrders.length} selected
              </span>
            )}
          </div>
          {userRole && hasPermission(userRole as any, "canDeleteOrders") && (
            <div className="flex items-center flex-wrap space-x-2">
              {selectedOrders.length > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  className="flex items-center px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                >
                  <FiTrash2 className="mr-2 h-4 w-4" />
                  Delete {selectedOrders.length} Selected
                </button>
              )}
              <button
                onClick={() => setDeleteAllModal(true)}
                className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm disabled:opacity-50"
                disabled={allOrders.length === 0 || isRefreshing}
              >
                <FiTrash2 className="mr-2 h-4 w-4" />
                Delete All
              </button>

              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm disabled:opacity-50"
                title="Refresh orders"
              >
                <FiRefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by Order ID, Customer, Email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-color focus:border-theme-color"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-color focus:border-theme-color"
            >
              <option value="all">All Status</option>
              {Object.values(ORDER_STATUSES).map((status: string) => (
                <option key={status} value={status}>
                  {getStatusDisplayInfo(status as OrderStatus).label}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Filter */}
          <div className="sm:w-48">
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-color focus:border-theme-color"
            >
              <option value="all">All Payments</option>
              {Object.values(PAYMENT_STATUSES).map((status: string) => (
                <option key={status} value={status}>
                  {getPaymentStatusDisplayInfo(status as PaymentStatus, "online" as PaymentMethod).label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div ref={scrollContainerRef} className="overflow-x-auto relative max-h-[600px] overflow-y-auto">
        <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-theme-color bg-gray-100 border-gray-300 focus:ring-theme-color focus:ring-2 accent-theme-color disabled:opacity-50"
                  disabled={isRefreshing || allOrders.length === 0}
                />
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                Order
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                Customer
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                Status
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                Payment
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                Amount
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                Date
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {allOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-3 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedOrders.includes(order.id)}
                    onChange={() => handleSelectOrder(order.id)}
                    className="w-4 h-4 text-theme-color bg-gray-100 border-gray-300 focus:ring-theme-color focus:ring-2 accent-theme-color"
                  />
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <FiPackage className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        #{order.id}
                      </div>
                      <div className="text-xs text-gray-500">
                        {order.items?.length || 0} items
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {order.customerName}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {order.customerEmail}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  {editingOrder?.id === order.id ? (
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-theme-color focus:border-theme-color w-full"
                    >
                      <option value="">Select Status</option>
                      {userRole && getNextPossibleStatuses(userRole, order.status).map((status) => (
                        <option key={status} value={status}>
                          {status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusDisplayInfo(order.status).color}`}
                    >
                      {order.status}
                    </span>
                  )}
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  {editingPayment?.id === order.id ? (
                    <select
                      value={newPaymentStatus}
                      onChange={(e) => setNewPaymentStatus(e.target.value)}
                      className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-theme-color focus:border-theme-color w-full"
                    >
                      <option value="">Select Payment</option>
                      {Object.values(PAYMENT_STATUSES).map((status: string) => (
                        <option key={status} value={status}>
                          {getPaymentStatusDisplayInfo(status as PaymentStatus, order.paymentMethod as PaymentMethod).label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusDisplayInfo(order.paymentStatus, order.paymentMethod).color}`}
                      >
                        {getPaymentStatusDisplayInfo(order.paymentStatus, order.paymentMethod).label}
                      </span>
                      {order.paymentMethod && (
                        <div className="text-xs text-gray-500 capitalize mt-1 truncate">
                          {order.paymentMethod}
                        </div>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  <PriceFormat amount={order.totalAmount || 0} />
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleDateString()
                    : "N/A"}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                  {editingOrder?.id === order.id ? (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleUpdateStatus(order.id, newStatus)}
                        disabled={!newStatus || updatingOrder === order.id}
                        className="p-1 text-green-600 hover:text-green-900 disabled:text-gray-400 transition-colors"
                        title="Save Status"
                      >
                        {updatingOrder === order.id ? (
                          <FiLoader className="animate-spin" size={14} />
                        ) : (
                          <FiSave size={14} />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setEditingOrder(null);
                          setNewStatus("");
                        }}
                        className="p-1 text-gray-600 hover:text-gray-900 transition-colors"
                        title="Cancel"
                      >
                        <FiX size={14} />
                      </button>
                    </div>
                  ) : editingPayment?.id === order.id ? (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() =>
                          handleUpdatePaymentStatus(order.id, newPaymentStatus)
                        }
                        disabled={!newPaymentStatus || updatingOrder === order.id}
                        className="p-1 text-green-600 hover:text-green-900 disabled:text-gray-400 transition-colors"
                        title="Save Payment"
                      >
                        {updatingOrder === order.id ? (
                          <FiLoader className="animate-spin" size={14} />
                        ) : (
                          <FiSave size={14} />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setEditingPayment(null);
                          setNewPaymentStatus("");
                        }}
                        className="p-1 text-gray-600 hover:text-gray-900 transition-colors"
                        title="Cancel"
                      >
                        <FiX size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setViewOrderModal(order)}
                        className="p-1 text-theme-color hover:text-accent-color transition-colors"
                        title="View Details"
                      >
                        <FiEye size={14} />
                      </button>
                      <button
                        onClick={() => {
                          setEditingOrder(order);
                          setNewStatus(order.status);
                        }}
                        className="p-1 text-theme-color hover:text-accent-color transition-colors"
                        title="Edit Status"
                      >
                        <FiEdit2 size={14} />
                      </button>
                      <button
                        onClick={() => {
                          setEditingPayment(order);
                          setNewPaymentStatus(order.paymentStatus);
                        }}
                        className="p-1 text-green-600 hover:text-green-900 transition-colors"
                        title="Edit Payment"
                      >
                        💳
                      </button>
                      {userRole && hasPermission(userRole as any, "canDeleteOrders") && (
                        <button
                          onClick={() => handleDeleteOrder(order)}
                          className="p-1 text-red-600 hover:text-red-900 transition-colors"
                          title="Delete Order"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Empty State - only show when not loading and truly no orders */}
      {allOrders.length === 0 && !initialLoading && !loadingMore && !isRefreshing && (
        <div className="px-6 py-12 text-center">
          <FiPackage className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {debouncedSearchTerm || statusFilter !== "all" || paymentFilter !== "all"
              ? "Try adjusting your search or filter criteria."
              : "No orders have been placed yet."}
          </p>
        </div>
      )}

      {/* Loading More Indicator */}
      {loadingMore && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-center">
            <FiLoader className="animate-spin h-5 w-5 text-gray-500 mr-2" />
            <span className="text-sm text-gray-600">Loading more orders...</span>
          </div>
        </div>
      )}

      {/* Orders Count */}
      <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
        <div className="text-sm text-gray-700">
          Showing {allOrders.length} orders
          {selectedOrders.length > 0 && (
            <span className="ml-2 text-orange-600 font-medium">
              • {selectedOrders.length} selected
            </span>
          )}
          {!hasMore && allOrders.length > 0 && (
            <span className="ml-2 text-green-600 font-medium">
              • All orders loaded
            </span>
          )}
        </div>
      </div>

      {/* View Order Modal */}
      {viewOrderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Order Details
                </h3>
                <button
                  onClick={() => setViewOrderModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX size={24} />
                </button>
              </div>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <h4 className="font-medium text-gray-900">Order Information</h4>
                <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Order ID
                    </dt>
                    <dd className="text-sm text-gray-900">
                      #{viewOrderModal.id}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Status
                    </dt>
                    <dd className="text-sm text-gray-900">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusDisplayInfo(viewOrderModal.status).color}`}
                      >
                        {viewOrderModal.status}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Customer
                    </dt>
                    <dd className="text-sm text-gray-900">
                      {viewOrderModal.customerName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="text-sm text-gray-900">
                      {viewOrderModal.customerEmail}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Total Amount
                    </dt>
                    <dd className="text-sm text-gray-900">
                      <PriceFormat amount={viewOrderModal.totalAmount || 0} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Date</dt>
                    <dd className="text-sm text-gray-900">
                      {viewOrderModal.createdAt
                        ? new Date(viewOrderModal.createdAt).toLocaleString()
                        : "N/A"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Payment Status
                    </dt>
                    <dd className="text-sm text-gray-900">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusDisplayInfo(viewOrderModal.paymentStatus, viewOrderModal.paymentMethod).color}`}
                      >
                        {getPaymentStatusDisplayInfo(viewOrderModal.paymentStatus, viewOrderModal.paymentMethod).label}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Payment Method
                    </dt>
                    <dd className="text-sm text-gray-900 capitalize">
                      {viewOrderModal.paymentMethod || "Not specified"}
                    </dd>
                  </div>
                </dl>
              </div>

              {viewOrderModal.paymentScreenshot && (
                <div>
                  <h4 className="font-medium text-gray-900">Payment Screenshot</h4>
                  <div className="mt-2">
                    <img
                      src={viewOrderModal.paymentScreenshot}
                      alt="Payment Screenshot"
                      className="max-w-full h-auto rounded-lg border border-gray-200"
                    />
                  </div>
                </div>
              )}

              {viewOrderModal.items && viewOrderModal.items.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900">Items</h4>
                  <div className="mt-2 space-y-2">
                    {viewOrderModal.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          {item.thumbnail && (
                            <img
                              src={item.thumbnail}
                              alt={item.title}
                              className="h-12 w-12 object-cover rounded"
                            />
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {item.title}
                            </p>
                            <p className="text-sm text-gray-500">
                              Qty: {item.quantity}
                            </p>
                          </div>
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          <PriceFormat
                            amount={item.price * item.quantity}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewOrderModal.orderAddress && (
                <div>
                  <h4 className="font-medium text-gray-900">
                    Order Address
                  </h4>
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-900">
                      {viewOrderModal.orderAddress.address}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex justify-end">
                <button
                  onClick={() => setViewOrderModal(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Order Modal */}
      {deleteOrderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="px-6 py-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <FiTrash2 className="mr-2 h-5 w-5 text-red-600" />
                Delete Order
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Are you sure you want to delete order{" "}
                <strong>
                  #{deleteOrderModal.id}
                </strong>
                ?
              </p>
              <div className="mt-3 bg-gray-50 rounded-lg p-3">
                <div className="text-sm text-gray-700">
                  <div>
                    <strong>Customer:</strong> {deleteOrderModal.customerName}
                  </div>
                  <div>
                    <strong>Amount:</strong>{" "}
                    <PriceFormat amount={deleteOrderModal.totalAmount} />
                  </div>
                  <div>
                    <strong>Items:</strong> {deleteOrderModal.items.length}{" "}
                    item(s)
                  </div>
                </div>
              </div>
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">
                  <strong>Warning:</strong> This action cannot be undone. The
                  order will be permanently removed from the database.
                </p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setDeleteOrderModal(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteOrder}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <FiLoader className="animate-spin mr-2 h-4 w-4" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <FiTrash2 className="mr-2 h-4 w-4" />
                    Delete Order
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Orders Modal */}
      {deleteAllModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="px-6 py-4">
              <h3 className="text-lg font-medium text-gray-900">
                Delete All Orders
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Are you sure you want to delete ALL orders? This action will
                remove all orders from both user accounts and the orders
                collection. This action cannot be undone.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setDeleteAllModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAllOrders}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <FiLoader className="animate-spin mr-2 h-4 w-4" />
                    Deleting...
                  </>
                ) : (
                  "Delete All"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Selected Orders Modal */}
      {deleteSelectedModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="px-6 py-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <FiTrash2 className="mr-2 h-5 w-5 text-red-600" />
                Delete Selected Orders
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Are you sure you want to delete{" "}
                <strong>{selectedOrders.length}</strong> selected orders? This
                action will permanently remove these orders from the database
                and cannot be undone.
              </p>
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Warning:</strong> This will delete the orders from
                  both the user accounts and the orders collection in Firestore.
                </p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setDeleteSelectedModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteSelected}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <FiLoader className="animate-spin mr-2 h-4 w-4" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <FiTrash2 className="mr-2 h-4 w-4" />
                    Delete {selectedOrders.length} Orders
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}



