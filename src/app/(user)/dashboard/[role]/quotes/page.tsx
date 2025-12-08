"use client";

import { useState, useEffect } from "react";
import { FiSearch, FiFilter, FiEye, FiEdit, FiSend, FiCheckCircle, FiClock, FiAlertCircle, FiMessageSquare, FiRefreshCw, FiX, FiSave, FiLoader } from "react-icons/fi";
import RoleProtectedRoute from "@/components/auth/RoleProtectedRoute";
import { toast } from "react-hot-toast";

interface QuoteProduct { name: string; quantity: number }

interface Quote {
  id: string;
  firestoreId: string;
  products?: QuoteProduct[];
  message?: string;
  status: "pending" | "in_review" | "completed";
  adminResponse: string | null;
  notified: boolean;
  createdAt: any;
  updatedAt: any;
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  in_review: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
};

const statusIcons = {
  pending: <FiClock className="w-4 h-4" />,
  in_review: <FiAlertCircle className="w-4 h-4" />,
  completed: <FiCheckCircle className="w-4 h-4" />,
};

export default function QuotesManagementPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [adminResponse, setAdminResponse] = useState("");
  const [updating, setUpdating] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const quotesPerPage = 10;

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/quotes");
      if (response.ok) {
        const data = await response.json();
        setQuotes(data.quotes || []);
      }
    } catch (error) {
      console.error("Error fetching quotes:", error);
      toast.error("Failed to load quotes");
    } finally {
      setLoading(false);
    }
  };

  const filteredQuotes = quotes.filter(quote => {
    const term = searchTerm.toLowerCase();
    const matchesMessage = (quote.message || "").toLowerCase().includes(term);
    const matchesProduct = (quote.products || []).some(p => (p.name || "").toLowerCase().includes(term));
    const matchesSearch = term ? (matchesMessage || matchesProduct) : true;
    const matchesStatus = statusFilter === "all" || quote.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredQuotes.length / quotesPerPage);
  const indexOfLastQuote = currentPage * quotesPerPage;
  const indexOfFirstQuote = indexOfLastQuote - quotesPerPage;
  const currentQuotes = filteredQuotes.slice(indexOfFirstQuote, indexOfLastQuote);

  // Pagination handlers
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleViewQuote = (quote: Quote) => {
    setSelectedQuote(quote);
    setAdminResponse(quote.adminResponse || "");
    setShowModal(true);
  };

  const handleUpdateQuote = async () => {
    if (!selectedQuote) return;

    // Prevent empty responses
    if (!adminResponse.trim()) {
      toast.error("Please provide a response before updating the quote");
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch(`/api/admin/quotes/${selectedQuote.firestoreId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adminResponse,
          status: "completed",
        }),
      });

      if (response.ok) {
        toast.success("Quote updated and marked as completed");
        await fetchQuotes();
        setShowModal(false);
        setSelectedQuote(null);
        setAdminResponse("");
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to update quote");
      }
    } catch (error) {
      console.error("Error updating quote:", error);
      toast.error("An error occurred while updating the quote");
    } finally {
      setUpdating(false);
    }
  };

  const handleSendNotifications = async (quote: Quote) => {
    if (quote.status !== "completed") {
      toast.error("Quote must be completed before sending notifications");
      return;
    }

    try {
      const response = await fetch("/api/quotes/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quoteId: quote.firestoreId,
        }),
      });

      if (response.ok) {
        await fetchQuotes();
        toast.success("Notifications sent successfully");
      } else {
        toast.error("Failed to send notifications");
      }
    } catch (error) {
      console.error("Error sending notifications:", error);
      toast.error("An error occurred while sending notifications");
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
            <FiMessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600 mr-2" />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              Quotes Management ({quotes.length})
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
                  placeholder="Search by name, email, or phone..."
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
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-colors"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in_review">In Review</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
            <div className="md:w-auto">
              <button
                onClick={fetchQuotes}
                disabled={loading}
                className="flex items-center px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm disabled:opacity-50"
                title="Refresh quotes data"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Quotes Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <FiLoader className="animate-spin h-8 w-8 text-indigo-600 mx-auto" />
                    <p className="mt-2 text-gray-600">Loading quotes...</p>
                  </td>
                </tr>
              ) : currentQuotes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <FiMessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="text-gray-500 mt-4">No quotes found matching your criteria</p>
                  </td>
                </tr>
              ) : (
                currentQuotes.map((quote) => (
                  <tr key={quote.firestoreId} className="hover:bg-gray-50">
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-xs sm:text-sm font-medium text-indigo-800">
                              {quote.products && quote.products.length && quote.products[0].name
                                ? quote.products[0].name.charAt(0).toUpperCase()
                                : (quote.id ? String(quote.id).charAt(0).toUpperCase() : "#")}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {quote.products && quote.products.length > 0
                              ? quote.products.map(p => p.name).join(", ")
                              : quote.id}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500 flex items-center truncate">
                            <span className="truncate">{(quote.message || "").slice(0, 80)}{(quote.message || "").length > 80 ? "..." : ""}</span>
                          </div>
                          {/* Mobile status display */}
                          <div className="sm:hidden mt-1">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[quote.status]}`}>
                              {quote.status.replace("_", " ").toUpperCase()}
                            </span>
                            {quote.notified && (
                              <span className="ml-2 inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                                Notified
                              </span>
                            )}
                          </div>
                          {/* Mobile date */}
                          <div className="md:hidden mt-1 text-xs text-gray-500">
                            {formatDate(quote.createdAt)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full ${statusColors[quote.status]}`}>
                          {statusIcons[quote.status]}
                          {quote.status.replace("_", " ").toUpperCase()}
                        </span>
                        {quote.notified && (
                          <span className="ml-2 inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                            Notified
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <FiClock className="h-4 w-4 mr-1" />
                        {formatDate(quote.createdAt)}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2">
                        <button
                          onClick={() => handleViewQuote(quote)}
                          disabled={updating || showModal}
                          className="inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="View Details"
                        >
                          <FiEye size={14} className="mr-1" />
                          View
                        </button>
                        {quote.status === "completed" && !quote.notified && (
                          <button
                            onClick={() => handleSendNotifications(quote)}
                            disabled={updating || showModal}
                            className="inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Send Notifications"
                          >
                            <FiSend size={14} className="mr-1" />
                            Notify
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredQuotes.length > quotesPerPage && (
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {indexOfFirstQuote + 1} to{" "}
                {Math.min(indexOfLastQuote, filteredQuotes.length)} of {filteredQuotes.length} quotes
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
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
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quote Details Modal */}
        {showModal && selectedQuote && (
          <div
            className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowModal(false);
                setSelectedQuote(null);
                setAdminResponse("");
              }
            }}
          >
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl mx-auto max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50">
                <div className="flex items-center">
                  <FiMessageSquare className="h-6 w-6 text-indigo-600 mr-3" />
                  <h3 className="text-xl font-semibold text-gray-900">
                    Quote Details
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedQuote(null);
                    setAdminResponse("");
                  }}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none p-1 rounded-full hover:bg-gray-100 transition-colors"
                  title="Close modal"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Customer Avatar Section */}
                <div className="flex flex-col items-center">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-lg">
                    <span className="text-2xl font-bold text-white">
                      {selectedQuote.products && selectedQuote.products.length && selectedQuote.products[0].name
                        ? selectedQuote.products[0].name.charAt(0).toUpperCase()
                        : (selectedQuote.id ? String(selectedQuote.id).charAt(0).toUpperCase() : "#")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Quote ID: {selectedQuote.id}</p>
                </div>

                {/* Customer Information Section */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                    <FiMessageSquare className="h-4 w-4 mr-2 text-gray-600" />
                    Request Details
                  </h4>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Products</label>
                      <div className="text-sm text-gray-900 bg-white p-2 rounded border">
                        {(selectedQuote.products || []).length === 0 ? (
                          <span className="text-gray-500">No products listed</span>
                        ) : (
                          <ul className="list-disc pl-5">
                            {(selectedQuote.products || []).map((p, i) => (
                              <li key={i} className="text-sm">
                                {p.name} — Qty: {p.quantity}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <div className="flex items-center">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full ${statusColors[selectedQuote.status]}`}>
                          {statusIcons[selectedQuote.status]}
                          {selectedQuote.status.replace("_", " ").toUpperCase()}
                        </span>
                        {selectedQuote.notified && (
                          <span className="ml-2 inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Notified</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quote Request Section */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                    <FiMessageSquare className="h-4 w-4 mr-2 text-blue-600" />
                    Quote Request
                  </h4>
                  <div className="bg-white p-4 rounded-lg border border-blue-100">
                    <p className="whitespace-pre-wrap text-sm text-gray-900">{selectedQuote.message}</p>
                  </div>
                  <div className="mt-3 text-xs text-blue-600">
                    Submitted on {formatDate(selectedQuote.createdAt)}
                  </div>
                </div>

                {/* Admin Response Section */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                    <FiEdit className="h-4 w-4 mr-2 text-amber-600" />
                    Admin Response
                  </h4>
                  <textarea
                    value={adminResponse}
                    onChange={(e) => setAdminResponse(e.target.value)}
                    placeholder="Enter your response to this quote request..."
                    rows={6}
                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-vertical"
                  />
                  <p className="text-xs text-amber-600 mt-2">
                    Your response will be sent to the customer via email and marked as completed
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-3 sm:space-y-0 px-6 py-4 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={handleUpdateQuote}
                  disabled={!adminResponse.trim() || updating}
                  className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {updating ? (
                    <>
                      <FiLoader className="animate-spin mr-2 h-4 w-4" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <FiSave className="mr-2 h-4 w-4" />
                      Save Response
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedQuote(null);
                    setAdminResponse("");
                  }}
                  disabled={updating}
                  className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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