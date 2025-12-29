"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Container from "@/components/Container";
import Title from "@/components/Title";
import PriceFormat from "@/components/PriceFormat";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  FiMessageSquare,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiSend,
  FiPaperclip,
  FiArrowLeft,
} from "react-icons/fi";
import Link from "next/link";
import { QuotationType, QuotationMessage, QuotationProductType } from "../../../../../../type";
import { getStatusDisplayInfo } from "@/lib/quoteStatuses";

export default function QuoteDetailPage() {
  const { id } = useParams();
  const { data: session } = useSession();
  const [quote, setQuote] = useState<QuotationType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id && session?.user?.email) {
      fetchQuote();
    }
  }, [id, session?.user?.email]);

  const fetchQuote = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/user/quotes/${id}`);

      if (!response.ok) {
        throw new Error("Failed to fetch quote");
      }

      const data = await response.json();
      setQuote(data.quote);
    } catch (err) {
      console.error("Error fetching quote:", err);
      setError("Failed to load quote");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !quote) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/user/quotes/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMessage }),
      });

      if (response.ok) {
        setNewMessage("");
        fetchQuote(); // Refresh quote data
      } else {
        alert("Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptQuote = async () => {
    if (!quote) return;

    try {
      const response = await fetch(`/api/user/quotes/${id}/accept`, {
        method: "POST",
      });

      if (response.ok) {
        fetchQuote(); // Refresh quote data
      } else {
        alert("Failed to accept quote");
      }
    } catch (error) {
      console.error("Error accepting quote:", error);
      alert("Failed to accept quote");
    }
  };

  const handleRejectQuote = async () => {
    if (!quote) return;

    try {
      const response = await fetch(`/api/user/quotes/${id}/reject`, {
        method: "POST",
      });

      if (response.ok) {
        fetchQuote(); // Refresh quote data
      } else {
        alert("Failed to reject quote");
      }
    } catch (error) {
      console.error("Error rejecting quote:", error);
      alert("Failed to reject quote");
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return "Invalid Date";
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const canNegotiate = quote?.status === "responded" || quote?.status === "negotiation" || quote?.status === "waiting_customer";
  const canAcceptReject = quote?.status === "responded";

  if (loading) {
    return (
      <ProtectedRoute loadingMessage="Loading quote details...">
        <Container className="py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </Container>
      </ProtectedRoute>
    );
  }

  if (error || !quote) {
    return (
      <ProtectedRoute loadingMessage="Loading quote details...">
        <Container className="py-8">
          <div className="text-center">
            <div className="text-red-600 mb-2">⚠️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {error || "Quotation not found"}
            </h3>
            <Link
              href="/account/quotes"
              className="inline-flex items-center text-theme-color hover:text-theme-color/80"
            >
              <FiArrowLeft className="w-4 h-4 mr-2" />
              Back to Quotations
            </Link>
          </div>
        </Container>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute loadingMessage="Loading quote details...">
      <Container className="py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/account/quotes"
            className="inline-flex items-center text-theme-color hover:text-theme-color/80 mb-4"
          >
            <FiArrowLeft className="w-4 h-4 mr-2" />
            Back to Quotations
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <Title className="text-2xl font-bold mb-2">
                Quotation {quote.id}
              </Title>
              <p className="text-gray-600">
                Submitted on {formatDate(quote.createdAt)}
              </p>
            </div>
            <span
              className={`px-3 py-1 text-sm font-medium rounded-full capitalize ${getStatusDisplayInfo(quote.status).color}`}
            >
              {quote.status}
            </span>
          </div>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
            {/* Products */}
            <div className="bg-white w-full overflow-hidden rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Products</h3>
              <div className="overflow-x-auto max-w-full">
                <table className="w-full border border-gray-300 min-w-[800px]">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left py-3 px-4 font-medium text-gray-700 border-b border-gray-300 whitespace-nowrap">
                        Product ID
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 border-b border-gray-300 whitespace-nowrap">
                        Product Name
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 border-b border-gray-300 whitespace-nowrap">
                        Quantity
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 border-b border-gray-300 whitespace-nowrap">
                        Unit Price
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 border-b border-gray-300 whitespace-nowrap">
                        Total Price
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {quote.products.map((product: QuotationProductType, index: number) => (
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

              {quote.status === "pending" && (
                <div className="mt-4 p-4 bg-light-bg border border-border-color rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-theme-color rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-theme-white text-xs">ℹ</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-1">Quotation Status: Pending</h4>
                      <p className="text-sm text-light-text">
                        Unit prices and total prices will be provided by our team after reviewing your quote request.
                        You'll receive an email notification once your quote is processed.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Pricing */}
            {quote.finalAmount > 0 && (
              <div className="bg-white rounded-lg shadow p-6 overflow-auto">
                <h3 className="text-lg font-semibold mb-4">Pricing</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span><PriceFormat amount={quote.subtotal} /></span>
                  </div>
                  {quote.discount && quote.discount > 0 && (
                    <div className="flex justify-between text-theme-color">
                      <span>Discount:</span>
                      <span>-<PriceFormat amount={quote.discount} /></span>
                    </div>
                  )}
                  {quote.deliveryFee && quote.deliveryFee > 0 && (
                    <div className="flex justify-between">
                      <span>Delivery Fee:</span>
                      <span><PriceFormat amount={quote.deliveryFee} /></span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                    <span>Total:</span>
                    <span><PriceFormat amount={quote.finalAmount} /></span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            {canAcceptReject && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Actions</h3>
                <div className="flex space-x-4">
                  <button
                    onClick={handleAcceptQuote}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                  >
                    <FiCheckCircle className="w-4 h-4 mr-2" />
                    Accept Quotation
                  </button>
                  <button
                    onClick={handleRejectQuote}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                  >
                    <FiXCircle className="w-4 h-4 mr-2" />
                    Reject Quotation
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Negotiation Chat */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <FiMessageSquare className="w-5 h-5 mr-2" />
                Messages
              </h3>

              {/* Messages */}
              <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                {quote.messages.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No messages yet. The seller will respond soon.
                  </p>
                ) : (
                  quote.messages.map((message: QuotationMessage, index: number) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg ${
                        message.sender === "user"
                          ? "bg-blue-50 ml-8"
                          : "bg-gray-50 mr-8"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-600">
                          {message.sender === "user" ? "You" : "Seller"}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(message.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm">{message.message}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input */}
              {canNegotiate && (
                <div className="border-t pt-4">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                      placeholder="Type your message..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-color focus:border-transparent outline-none"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || isSubmitting}
                      className="px-4 py-2 bg-theme-color text-white rounded-lg hover:bg-theme-color/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FiSend className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quote Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Quotation Information</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium">Status:</span>{" "}
                  <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusDisplayInfo(quote.status).color}`}>
                    {quote.status}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Submitted:</span>{" "}
                  {formatDate(quote.createdAt)}
                </div>
                <div>
                  <span className="font-medium">Valid Until:</span>{" "}
                  {formatDate(quote.validUntil)}
                </div>
                {quote.deliveryAddress && (
                  <div>
                    <span className="font-medium">Delivery Address:</span>{" "}
                    {quote.deliveryAddress}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </ProtectedRoute>
  );
}
