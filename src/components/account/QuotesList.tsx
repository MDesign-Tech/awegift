"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import PriceFormat from "@/components/PriceFormat";
import {
  FiEye,
  FiX,
  FiPackage,
  FiCalendar,
  FiMessageSquare,
  FiCheckCircle,
  FiXCircle,
  FiClock,
} from "react-icons/fi";
import Link from "next/link";
import { QuotationType, QuotationProductType } from "../../../type";
import { getStatusDisplayInfo, QuotationStatus } from "@/lib/quoteStatuses";
import { getData } from "@/app/(user)/helpers";

interface QuotesListProps {
  showHeader?: boolean;
  onQuotesChange?: (quotes: QuotationType[]) => void;
}

export default function QuotesList({
  showHeader = false,
  onQuotesChange,
}: QuotesListProps) {
  const { data: session } = useSession();
  const [quotes, setQuotes] = useState<QuotationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<QuotationType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (session?.user?.email) {
      fetchQuotes();
    }
  }, [session?.user?.email]);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const response = await getData("/api/user/quotes");

      if (!response.ok) {
        throw new Error("Failed to fetch quotes");
      }

      const data = await response.json();
      if (data.quotes && Array.isArray(data.quotes)) {
        const sortedQuotes = data.quotes.sort(
          (a: QuotationType, b: QuotationType) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setQuotes(sortedQuotes);
        onQuotesChange?.(sortedQuotes);
      }
    } catch (err) {
      console.error("Error fetching quotes:", err);
      setError("Failed to load quotes");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getTimeAgo = (date: string | Date) => {
    const now = new Date();
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const diffInMs = now.getTime() - dateObj.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    if (diffInHours < 1) {
      const minutes = Math.floor(diffInMs / (1000 * 60));
      return `${minutes} mins ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInDays < 7) {
      return `${Math.floor(diffInDays)} days ago`;
    } else {
      return formatDate(date);
    }
  };


  const getProductSummary = (products: QuotationProductType[]) => {
    if (products.length === 0) return { name: "No products", quantity: 0, image: null };

    if (products.length === 1) {
      return {
        name: products[0].name,
        quantity: products[0].quantity,
        image: null, // We'll need to fetch product image if productId exists
      };
    }

    return {
      name: `${products.length} Items • Mixed Products`,
      quantity: products.reduce((sum, p) => sum + p.quantity, 0),
      image: null,
    };
  };

  const getEstimatedPrice = (quote: QuotationType) => {
    if (quote.finalAmount > 0) {
      return `${quote.finalAmount.toLocaleString()} RWF`;
    }
    return "Waiting for seller response";
  };

  const openQuoteModal = (quote: QuotationType) => {
    setSelectedQuote(quote);
    setIsModalOpen(true);
  };

  const closeQuoteModal = () => {
    setSelectedQuote(null);
    setIsModalOpen(false);
  };

  const QuoteDetailsModal = () => {
    if (!selectedQuote || !isModalOpen) return null;

    const productSummary = getProductSummary(selectedQuote.products);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Background overlay */}
        <div
          className="absolute inset-0 bg-black/50 transition-opacity"
          onClick={closeQuoteModal}
        ></div>

        {/* Modal */}
        <div className="relative w-full max-w-4xl bg-white shadow-xl rounded-lg overflow-hidden z-10 max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Quotation Details - {selectedQuote.id}
              </h3>
              <p className="text-sm text-gray-600">
                Submitted on {formatDate(selectedQuote.createdAt)}
              </p>
            </div>
            <button
              onClick={closeQuoteModal}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="px-6 py-4 max-h-96 overflow-y-auto">
            {/* Quote Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-light-bg rounded-lg">
                  <FiPackage className="w-5 h-5 text-theme-color" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Quotation Status</p>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusDisplayInfo(selectedQuote.status).color}`}
                  >
                    {selectedQuote.status}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="p-2 bg-light-bg rounded-lg">
                  <FiMessageSquare className="w-5 h-5 text-theme-color" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estimated Quotation Price</p>
                  <p className="font-semibold text-gray-900">
                    {getEstimatedPrice(selectedQuote)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="p-2 bg-light-bg rounded-lg">
                  <FiCalendar className="w-5 h-5 text-theme-color" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Last Update</p>
                  <p className="font-semibold text-gray-900">
                    {getTimeAgo(selectedQuote.updatedAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Products */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Quotation Products ({selectedQuote.products.length})
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-300 min-w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left py-3 px-4 font-medium text-gray-700 border-b border-gray-300 whitespace-nowrap text-sm">
                        Product ID
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 border-b border-gray-300 whitespace-nowrap text-sm">
                        Product Name
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 border-b border-gray-300 whitespace-nowrap text-sm">
                        Quantity
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 border-b border-gray-300 whitespace-nowrap text-sm">
                        Unit Price
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 border-b border-gray-300 whitespace-nowrap text-sm">
                        Total Price
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedQuote.products.map((product: QuotationProductType, index: number) => (
                      <tr key={`${product.productId || 'custom'}-${index}`} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {product.productId ? (
                            <span className="font-mono text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              {product.productId.slice(-8)}
                            </span>
                          ) : (
                            <span className="text-gray-500 italic">Custom</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900 font-medium">
                          {product.name || "—"}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {product.quantity || 0}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {product.unitPrice ? (
                            <PriceFormat amount={product.unitPrice} />
                          ) : (
                            <span className="text-light-text">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900 font-medium">
                          {product.totalPrice ? (
                            <PriceFormat amount={product.totalPrice} />
                          ) : (
                            <span className="text-light-text">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedQuote.status === "pending" && (
                <div className="mt-4 p-4 bg-light-bg border border-border-color rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-theme-color rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-theme-white text-xs">ℹ</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-1">Quotation Status: Pending</h4>
                      <p className="text-sm text-light-text">
                        Unit prices and total prices will be provided by our team after reviewing your quote request.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Notes */}
            {selectedQuote.userNotes && (
              <div className="mt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Additional Notes
                </h4>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700">{selectedQuote.userNotes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeQuoteModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <Link
                href={`/account/quotes/${selectedQuote.id}`}
                className="px-4 py-2 text-sm font-medium text-white bg-theme-color rounded-md hover:bg-theme-color/90 transition-colors"
              >
                View Full Quotation
              </Link>
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
            <h2 className="text-2xl font-bold text-gray-900">Quotation History</h2>
            <p className="text-gray-600">Track and manage your quotations</p>
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
          Error Loading Quotations
        </h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchQuotes}
          className="px-4 py-2 bg-theme-color text-white rounded-lg hover:bg-theme-color/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (quotes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">💬</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Quotations Yet
        </h3>
        <p className="text-gray-600 mb-6">
          Looks like you haven't requested any quotations yet. Start by requesting a quotation for products you're interested in.
        </p>
        <Link
          href="/quote"
          className="inline-block px-6 py-3 bg-theme-color text-white rounded-lg hover:bg-theme-color/90 transition-colors"
        >
          Request a Quotation
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0">
      {showHeader && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Quotation History</h2>
          <p className="text-gray-600">
            {quotes.length} quotation{quotes.length !== 1 ? "s" : ""} found
          </p>
        </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden lg:block w-full max-w-7xl mx-auto">
        <div className="bg-white shadow ring-1 ring-black ring-opacity-5 rounded-lg w-full">
          <table className="w-full divide-y divide-gray-300 table-fixed">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                  Quotation ID
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                  Status
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                  Product Summary
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                  Estimated Quotation Price
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                  Date Requested
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                  Last Update
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                  Quotation Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {quotes.map((quote) => {
                const productSummary = getProductSummary(quote.products);
                return (
                  <tr key={quote.id} className="hover:bg-gray-50">
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {quote.id}
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusDisplayInfo(quote.status).color}`}
                      >
                        {quote.status}
                      </span>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-gray-300 rounded flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600">
                              {productSummary.name?.charAt(0)?.toUpperCase() || "P"}
                            </span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-900 truncate">
                          {productSummary.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {getEstimatedPrice(quote)}
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(quote.createdAt)}
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getTimeAgo(quote.updatedAt)}
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex flex-col space-y-1">
                        <button
                          onClick={() => openQuoteModal(quote)}
                          className="inline-flex items-center justify-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                          title="View Details"
                        >
                          <FiEye className="w-3 h-3" />
                        </button>
                        <Link
                          href={`/account/quotes/${quote.id}`}
                          className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                          title="View Full Quotation"
                        >
                          Track Quotation
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4 w-full">
        {quotes.map((quote) => {
          const productSummary = getProductSummary(quote.products);
          return (
            <div key={quote.id} className="bg-white rounded-lg shadow border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    {quote.id}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {formatDate(quote.createdAt)}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusDisplayInfo(quote.status).color}`}
                >
                  {quote.status}
                </span>
              </div>

              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gray-300 rounded flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-medium text-gray-600">
                    {productSummary.name?.charAt(0)?.toUpperCase() || "P"}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {productSummary.name}
                  </div>
                  <div className="text-xs text-gray-600">
                    {getEstimatedPrice(quote)}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  Updated {getTimeAgo(quote.updatedAt)}
                </div>
                <div className="flex flex-col space-y-1">
                  <button
                    onClick={() => openQuoteModal(quote)}
                    className="flex items-center justify-center px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  >
                    <FiEye className="w-3 h-3 mr-1" />
                    View
                  </button>
                  <Link
                    href={`/account/quotes/${quote.id}`}
                    className="flex items-center justify-center px-3 py-1 text-xs bg-theme-color text-white rounded hover:bg-theme-color/90 transition-colors"
                  >
                    Track
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quote Details Modal */}
      <QuoteDetailsModal />
    </div>
  );
}