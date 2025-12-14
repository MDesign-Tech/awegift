"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { TableSkeleton } from "./Skeletons";
import { toast } from "react-hot-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { hasPermission, UserRole } from "@/lib/rbac/roles";
import {
  FiPackage,
  FiX,
  FiEdit2,
  FiRefreshCw,
  FiTrash2,
  FiSave,
  FiEye,
  FiCalendar,
  FiMessageSquare,
  FiPaperclip,
} from "react-icons/fi";

import PriceFormat from "@/components/PriceFormat";
import { QuoteType, QuoteProductType, QuoteMessage } from '../../../type';


export default function DashboardQuotesClient() {
  const { data: session } = useSession();
  const { user, isAdmin } = useCurrentUser();
  const router = useRouter();
  const [quotes, setQuotes] = useState<QuoteType[]>([]);
  const [filteredQuotes, setFilteredQuotes] = useState<QuoteType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingQuote, setEditingQuote] = useState<QuoteType | null>(null);
  const [userRole, setUserRole] = useState<string>("");

  // Date filtering states
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [quotesPerPage] = useState(20);

  // Modal states
  const [deleteQuoteModal, setDeleteQuoteModal] = useState<QuoteType | null>(null);
  const [deleteAllModal, setDeleteAllModal] = useState(false);
  const [deleteSelectedModal, setDeleteSelectedModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Selected quotes state
  const [selectedQuotes, setSelectedQuotes] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    if (session?.user?.email) {
      fetchUserRole();
    }
  }, [session]);

  // Separate effect to fetch quotes after role is set
  useEffect(() => {
    if (userRole && userRole !== "" && session?.user?.email) {
      fetchQuotes();
    }
  }, [userRole, session?.user?.email]);

  const fetchUserRole = async () => {
    try {
      const response = await fetch(
        `/api/user/profile?email=${encodeURIComponent(
          session?.user?.email || ""
        )}`
      );
      if (response.ok) {
        const data = await response.json();
        const role = data.role || "user";
        setUserRole(role);
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
    }
  };

  const fetchQuotes = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/admin/quotes");

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to fetch quotes");
        return;
      }

      const data = await response.json();

      if (data.quotes) {
        setQuotes(data.quotes);
      } else {
        setQuotes([]);
      }
    } catch (error) {
      console.error("Error fetching quotes:", error);
      toast.error("Failed to fetch quotes");
    } finally {
      setLoading(false);
    }
  };

  // Filter quotes based on dates
  useEffect(() => {
    let filtered = [...quotes];

    // Date filter
    if (startDate || endDate) {
      filtered = filtered.filter((quote) => {
        const quoteDate = new Date(quote.createdAt);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        if (start && quoteDate < start) return false;
        if (end && quoteDate > end) return false;
        return true;
      });
    }

    setFilteredQuotes(filtered);
    setCurrentPage(1); // Reset to first page when filters change

    // Clear selections when filters change
    setSelectedQuotes([]);
    setSelectAll(false);
  }, [quotes, startDate, endDate]);

  // Calculate pagination
  const indexOfLastQuote = currentPage * quotesPerPage;
  const indexOfFirstQuote = indexOfLastQuote - quotesPerPage;
  const currentQuotes = filteredQuotes.slice(
    indexOfFirstQuote,
    indexOfLastQuote
  );
  const totalPages = Math.ceil(filteredQuotes.length / quotesPerPage);

  // Update selectAll state based on selected quotes
  useEffect(() => {
    if (currentQuotes.length > 0) {
      const allCurrentQuotesSelected = currentQuotes.every((quote) =>
        selectedQuotes.includes(quote.id)
      );
      setSelectAll(allCurrentQuotesSelected && selectedQuotes.length > 0);
    } else {
      setSelectAll(false);
    }
  }, [selectedQuotes, currentQuotes]);

  const handleDeleteQuote = async (quote: QuoteType) => {
    setDeleteQuoteModal(quote);
  };

  const confirmDeleteQuote = async () => {
    if (!deleteQuoteModal) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/quotes/${deleteQuoteModal.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Quote deleted successfully");
        await fetchQuotes();
        setDeleteQuoteModal(null);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to delete quote");
      }
    } catch (error) {
      console.error("Error deleting quote:", error);
      toast.error("Error deleting quote");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAllQuotes = async () => {
    setIsDeleting(true);
    try {
      // Note: This would need a bulk delete API endpoint
      toast.error("Bulk delete not implemented yet");
    } catch (error) {
      console.error("Error deleting all quotes:", error);
      toast.error("Error deleting all quotes");
    } finally {
      setIsDeleting(false);
    }
  };

  // Selection handlers
  const handleSelectQuote = (quoteId: string) => {
    setSelectedQuotes((prev) =>
      prev.includes(quoteId)
        ? prev.filter((id) => id !== quoteId)
        : [...prev, quoteId]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedQuotes([]);
    } else {
      setSelectedQuotes(currentQuotes.map((quote) => quote.id));
    }
    setSelectAll(!selectAll);
  };

  const handleDeleteSelected = () => {
    if (selectedQuotes.length === 0) {
      toast.error("Please select quotes to delete");
      return;
    }
    setDeleteSelectedModal(true);
  };

  const confirmDeleteSelected = async () => {
    if (selectedQuotes.length === 0) return;

    setIsDeleting(true);
    try {
      // Note: This would need a bulk delete API endpoint
      toast.error("Bulk delete selected not implemented yet");
    } catch (error) {
      console.error("Error deleting selected quotes:", error);
      toast.error("Error deleting selected quotes");
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "responded":
        return "bg-blue-100 text-blue-800";
      case "waiting_customer":
        return "bg-orange-100 text-orange-800";
      case "negotiation":
        return "bg-purple-100 text-purple-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "expired":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return <TableSkeleton rows={5} />;
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Quotes Management ({filteredQuotes.length})
          </h2>
          {userRole && hasPermission(userRole as any, "canManageQuotes") && (
            <div className="flex items-center space-x-2">
              {selectedQuotes.length > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  className="flex items-center px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                >
                  <FiTrash2 className="mr-2 h-4 w-4" />
                  Delete Selected ({selectedQuotes.length})
                </button>
              )}
              <button
                onClick={() => setDeleteAllModal(true)}
                className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                disabled={quotes.length === 0}
              >
                <FiTrash2 className="mr-2 h-4 w-4" />
                Delete All
              </button>
              <button
                onClick={fetchQuotes}
                className="flex items-center px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
              >
                <FiRefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Date Filters */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Quotes Table */}
      <div className="overflow-x-auto">
        <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                <input
                  type="checkbox"
                  checked={selectAll && currentQuotes.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                Quote
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                Customer
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                Status
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
            {currentQuotes.map((quote) => (
              <tr key={quote.id} className="hover:bg-gray-50">
                <td className="px-3 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedQuotes.includes(quote.id)}
                    onChange={() => handleSelectQuote(quote.id)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <FiPackage className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        #{quote.id}
                      </div>
                      <div className="text-xs text-gray-500">
                        {quote.products?.length || 0} items
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {quote.email}
                    </div>
                    {quote.phone && (
                      <div className="text-xs text-gray-500 truncate">
                        {quote.phone}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                      quote.status
                    )}`}
                  >
                    {quote.status.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  <PriceFormat amount={quote.finalAmount || 0} />
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                  {quote.createdAt
                    ? new Date(quote.createdAt).toLocaleDateString()
                    : "N/A"}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => router.push(`/dashboard/quotes/${quote.id}`)}
                      className="p-1 text-blue-600 hover:text-blue-900 transition-colors"
                      title="View Details"
                    >
                      <FiEye size={14} />
                    </button>
                    <button
                      onClick={() => router.push(`/dashboard/quotes/${quote.id}`)}
                      className="p-1 text-indigo-600 hover:text-indigo-900 transition-colors"
                      title="Edit Quote"
                    >
                      <FiEdit2 size={14} />
                    </button>
                    {userRole && hasPermission(userRole as any, "canManageQuotes") && (
                      <button
                        onClick={() => handleDeleteQuote(quote)}
                        className="p-1 text-red-600 hover:text-red-900 transition-colors"
                        title="Delete Quote"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {filteredQuotes.length === 0 && !loading && (
        <div className="px-6 py-12 text-center">
          <FiPackage className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No quotes</h3>
          <p className="mt-1 text-sm text-gray-500">
            {startDate || endDate
              ? "No quotes match your date criteria"
              : "No quotes have been requested yet"}
          </p>
        </div>
      )}


      {/* Delete Quote Modal */}
      {deleteQuoteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="px-6 py-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <FiTrash2 className="mr-2 h-5 w-5 text-red-600" />
                Delete Quote
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Are you sure you want to delete quote{" "}
                <strong>
                  #{deleteQuoteModal.id}
                </strong>
                ?
              </p>
              <div className="mt-3 bg-gray-50 rounded-lg p-3">
                <div className="text-sm text-gray-700">
                  <div>
                    <strong>Customer:</strong> {deleteQuoteModal.email}
                  </div>
                  <div>
                    <strong>Amount:</strong>{" "}
                    <PriceFormat amount={deleteQuoteModal.finalAmount} />
                  </div>
                  <div>
                    <strong>Items:</strong> {deleteQuoteModal.products.length}{" "}
                    item(s)
                  </div>
                </div>
              </div>
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">
                  <strong>Warning:</strong> This action cannot be undone. The
                  quote will be permanently removed from the database.
                </p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setDeleteQuoteModal(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteQuote}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <FiTrash2 className="mr-2 h-4 w-4" />
                    Delete Quote
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Quotes Modal */}
      {deleteAllModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="px-6 py-4">
              <h3 className="text-lg font-medium text-gray-900">
                Delete All Quotes
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Are you sure you want to delete ALL quotes? This action will
                remove all quotes from the database. This action cannot be undone.
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
                onClick={handleDeleteAllQuotes}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete All"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Selected Quotes Modal */}
      {deleteSelectedModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="px-6 py-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <FiTrash2 className="mr-2 h-5 w-5 text-red-600" />
              Delete Selected Quotes
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to delete{" "}
              <strong>{selectedQuotes.length}</strong> selected quotes? This
              action will permanently remove these quotes from the database
              and cannot be undone.
            </p>
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>Warning:</strong> This will delete the quotes from
                the database.
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
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <FiTrash2 className="mr-2 h-4 w-4" />
                  Delete {selectedQuotes.length} Quotes
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Pagination */}
      {filteredQuotes.length > quotesPerPage && (
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {indexOfFirstQuote + 1} to{" "}
              {Math.min(indexOfLastQuote, filteredQuotes.length)} of{" "}
              {filteredQuotes.length} results
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-2 text-sm font-medium text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
