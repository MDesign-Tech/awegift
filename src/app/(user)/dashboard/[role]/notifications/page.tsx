"use client";

import { useState, useEffect } from "react";
import { FiSearch, FiFilter, FiEye, FiTrash2, FiBell, FiRefreshCw, FiX, FiChevronLeft, FiChevronRight, FiLoader } from "react-icons/fi";
import RoleProtectedRoute from "@/components/auth/RoleProtectedRoute";
import { toast } from "react-hot-toast";

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: Date;
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<Notification | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const notificationsPerPage = 10;

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/notifications");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      } else {
        toast.error("Failed to load notifications");
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.userId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || notification.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredNotifications.length / notificationsPerPage);
  const indexOfLastNotification = currentPage * notificationsPerPage;
  const indexOfFirstNotification = indexOfLastNotification - notificationsPerPage;
  const currentNotifications = filteredNotifications.slice(indexOfFirstNotification, indexOfLastNotification);

  // Pagination handlers
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleViewNotification = (notification: Notification) => {
    setSelectedNotification(notification);
    setShowModal(true);
  };


  const confirmDeleteNotification = (notification: Notification) => {
    setNotificationToDelete(notification);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!notificationToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/notifications/${notificationToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Notification deleted successfully");
        setNotifications(prev => prev.filter(n => n.id !== notificationToDelete.id));
        setShowDeleteModal(false);
        setNotificationToDelete(null);
        // Reset to page 1 if current page would be empty
        const remainingNotifications = notifications.length - 1;
        const maxPage = Math.ceil(remainingNotifications / notificationsPerPage);
        if (currentPage > maxPage && maxPage > 0) {
          setCurrentPage(maxPage);
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to delete notification");
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Failed to delete notification");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  return (
    <RoleProtectedRoute allowedRoles={["admin"]}>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50">
          <div className="flex items-center mb-4 sm:mb-0">
            <FiBell className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600 mr-2" />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              Notifications Management ({notifications.length})
            </h2>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by title, message, or user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
            <div className="md:w-48">
              <div className="relative">
                <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-colors"
                >
                  <option value="all">All Types</option>
                  <option value="quote_response">Quote Response</option>
                  <option value="order_update">Order Update</option>
                  <option value="system">System</option>
                </select>
              </div>
            </div>
            <div className="md:w-auto">
              <button
                onClick={fetchNotifications}
                disabled={loading}
                className="flex items-center px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm disabled:opacity-50"
                title="Refresh notifications data"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Notifications Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <FiLoader className="animate-spin h-8 w-8 text-indigo-600 mx-auto" />
                    <p className="mt-2 text-gray-600">Loading notifications...</p>
                  </td>
                </tr>
              ) : currentNotifications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <FiBell className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="text-gray-500 mt-4">No notifications found matching your criteria</p>
                  </td>
                </tr>
              ) : (
                currentNotifications.map((notification) => (
                  <tr key={notification.id} className="hover:bg-gray-50">
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-xs sm:text-sm font-medium text-indigo-800">
                              {notification.userId.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {notification.userId}
                          </div>
                          {/* Mobile title display */}
                          <div className="sm:hidden mt-1">
                            <div className="text-xs font-medium text-gray-900 truncate">
                              {notification.title}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {notification.message}
                            </div>
                          </div>
                          {/* Mobile status and type */}
                          <div className="md:hidden mt-1 flex items-center space-x-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              notification.read
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}>
                              {notification.read ? "Read" : "Unread"}
                            </span>
                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              {notification.type.replace("_", " ").toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {notification.message}
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {notification.type.replace("_", " ").toUpperCase()}
                      </span>
                    </td>
                    <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                        notification.read
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {notification.read ? "Read" : "Unread"}
                      </span>
                    </td>
                    <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <FiBell className="h-4 w-4 mr-1" />
                        {formatDate(notification.createdAt)}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2">
                        <button
                          onClick={() => handleViewNotification(notification)}
                          disabled={isDeleting || showModal || showDeleteModal}
                          className="inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="View Details"
                        >
                          <FiEye size={14} className="mr-1" />
                          View
                        </button>
                        <button
                          onClick={() => confirmDeleteNotification(notification)}
                          disabled={isDeleting || showModal || showDeleteModal}
                          className="inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete Notification"
                        >
                          <FiTrash2 size={14} className="mr-1" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredNotifications.length > notificationsPerPage && (
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {indexOfFirstNotification + 1} to{" "}
                {Math.min(indexOfLastNotification, filteredNotifications.length)} of {filteredNotifications.length} notifications
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiChevronLeft className="h-4 w-4" />
                  Previous
                </button>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => handlePageChange(i + 1)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        currentPage === i + 1
                          ? "bg-indigo-600 text-white"
                          : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <FiChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notification Details Modal */}
        {showModal && selectedNotification && (
          <div
            className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowModal(false);
                setSelectedNotification(null);
              }
            }}
          >
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50">
                <div className="flex items-center">
                  <FiBell className="h-6 w-6 text-indigo-600 mr-3" />
                  <h3 className="text-xl font-semibold text-gray-900">
                    Notification Details
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedNotification(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none p-1 rounded-full hover:bg-gray-100 transition-colors"
                  title="Close modal"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* User Avatar Section */}
                <div className="flex flex-col items-center">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-lg">
                    <span className="text-2xl font-bold text-white">
                      {selectedNotification.userId.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    User: {selectedNotification.userId}
                  </p>
                </div>

                {/* Notification Information Section */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                    <FiBell className="h-4 w-4 mr-2 text-gray-600" />
                    Notification Information
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title
                      </label>
                      <p className="text-sm text-gray-900 bg-white p-2 rounded border">
                        {selectedNotification.title}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type
                      </label>
                      <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {selectedNotification.type.replace("_", " ").toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                        selectedNotification.read
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {selectedNotification.read ? "Read" : "Unread"}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Created
                      </label>
                      <p className="text-sm text-gray-900 bg-white p-2 rounded border">
                        {formatDate(selectedNotification.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Message Section */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                    <FiBell className="h-4 w-4 mr-2 text-blue-600" />
                    Message Content
                  </h4>
                  <div className="bg-white p-4 rounded-lg border border-blue-100">
                    <p className="whitespace-pre-wrap text-sm text-gray-900">
                      {selectedNotification.message}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end px-6 py-4 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedNotification(null);
                  }}
                  className="inline-flex justify-center items-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors shadow-sm"
                >
                  <FiX className="mr-2 h-4 w-4" />
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && notificationToDelete && (
          <div
            className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowDeleteModal(false);
                setNotificationToDelete(null);
              }
            }}
          >
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Delete Notification</h3>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setNotificationToDelete(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none"
                  disabled={isDeleting}
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                    <FiTrash2 className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-medium text-gray-900">
                      Are you sure?
                    </h4>
                    <p className="text-sm text-gray-500">
                      This action cannot be undone.
                    </p>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      {notificationToDelete.userId ? (
                        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-red-800">
                            {notificationToDelete.userId.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      ) : (
                        <FiBell className="h-10 w-10 text-red-400" />
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-red-900">
                        {notificationToDelete.title}
                      </div>
                      <div className="text-sm text-red-700">
                        {notificationToDelete.userId}
                      </div>
                      <div className="text-xs text-red-600 mt-1">
                        Type: {notificationToDelete.type.replace("_", " ").toUpperCase()} •
                        Status: {notificationToDelete.read ? "Read" : "Unread"}
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-600">
                  Deleting this notification will permanently remove it from the system. This action cannot be undone.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0 px-6 py-4 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={handleDeleteConfirmed}
                  disabled={isDeleting}
                  className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <>
                      <FiLoader className="animate-spin mr-2 h-4 w-4" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <FiTrash2 className="mr-2 h-4 w-4" />
                      Delete Notification
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setNotificationToDelete(null);
                  }}
                  disabled={isDeleting}
                  className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiX className="mr-2 h-4 w-4" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleProtectedRoute>
  );
}