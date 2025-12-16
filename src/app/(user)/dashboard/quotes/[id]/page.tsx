"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Container from "@/components/Container";
import Title from "@/components/Title";
import PriceFormat from "@/components/PriceFormat";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  FiMessageSquare,
  FiSave,
  FiSend,
  FiPaperclip,
  FiArrowLeft,
  FiEdit2,
} from "react-icons/fi";
import Link from "next/link";
import { QuotationType, QuotationMessage, QuotationProductType } from "../../../../../../type";
import { toast } from "react-hot-toast";

export default function AdminQuoteDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [quote, setQuote] = useState<QuotationType | null>(null);
  const [editableQuote, setEditableQuote] = useState<QuotationType | null>(null);
  const [productsData, setProductsData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'quote' | 'messages'>('quote');
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmittingMessage, setIsSubmittingMessage] = useState(false);

  useEffect(() => {
    if (id && session?.user?.email) {
      fetchQuote();
    }
  }, [id, session?.user?.email]);

  // Fetch product data for products with productId
  useEffect(() => {
    if (editableQuote) {
      const fetchProductData = async () => {
        const productIds: string[] = editableQuote.products
          .filter((p: QuotationProductType) => p.productId)
          .map((p: QuotationProductType) => p.productId!)
          .filter((id): id is string => id !== null);

        if (productIds.length === 0) return;

        try {
          const promises = productIds.map((id: string) =>
            fetch(`/api/products/${id}`).then(res => res.json())
          );
          const products = await Promise.all(promises);
          const productMap: any = {};
          products.forEach((product: any) => {
            if (product.id) {
              productMap[product.id] = product;
            }
          });
          setProductsData(productMap);
        } catch (error) {
          console.error('Error fetching product data:', error);
        }
      };

      fetchProductData();
    }
  }, [editableQuote]);

  const fetchQuote = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/quotes/${id}`);

      if (!response.ok) {
        throw new Error("Failed to fetch quote");
      }

      const data = await response.json();
      setQuote(data);
      setEditableQuote(data);
    } catch (err) {
      console.error("Error fetching quote:", err);
      toast.error("Failed to load quote");
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const calculateTotals = (products: QuotationProductType[], discount = 0, deliveryFee = 0) => {
    const subtotal = products.reduce((sum, product) => {
      return sum + (product.unitPrice || 0) * product.quantity;
    }, 0);

    const finalAmount = Math.max(0, subtotal - discount + deliveryFee);

    return { subtotal, finalAmount };
  };

  // Update product field
  const updateProduct = (index: number, field: keyof QuotationProductType, value: any) => {
    if (!editableQuote) return;

    const updatedProducts = [...editableQuote.products];
    updatedProducts[index] = { ...updatedProducts[index], [field]: value };

    // Recalculate total price for the product
    if (field === 'unitPrice' || field === 'quantity') {
      const product = updatedProducts[index];
      updatedProducts[index].totalPrice = (product.unitPrice || 0) * product.quantity;
    }

    const { subtotal, finalAmount } = calculateTotals(
      updatedProducts,
      editableQuote.discount || 0,
      editableQuote.deliveryFee || 0
    );

    setEditableQuote({
      ...editableQuote,
      products: updatedProducts,
      subtotal,
      finalAmount
    });
  };

  // Update quote fields
  const updateQuoteField = (field: keyof QuotationType, value: any) => {
    if (!editableQuote) return;

    const updatedQuote = { ...editableQuote, [field]: value };

    if (field === 'discount' || field === 'deliveryFee') {
      const { subtotal, finalAmount } = calculateTotals(
        updatedQuote.products,
        updatedQuote.discount || 0,
        updatedQuote.deliveryFee || 0
      );
      updatedQuote.subtotal = subtotal;
      updatedQuote.finalAmount = finalAmount;
    }

    setEditableQuote(updatedQuote);
  };

  // Save quote changes
  const handleSaveQuote = async () => {
    if (!editableQuote) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/quotes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editableQuote),
      });

      if (response.ok) {
        toast.success('Quote updated successfully');
        setQuote(editableQuote);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update quote');
      }
    } catch (error) {
      console.error('Error updating quote:', error);
      toast.error('Error updating quote');
    } finally {
      setSaving(false);
    }
  };

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !editableQuote) return;

    const message: QuotationMessage = {
      sender: 'admin',
      message: newMessage,
      timestamp: new Date(),
      attachments: attachments.length > 0 ? attachments.map(f => f.name) : undefined,
    };

    const updatedMessages = [...(editableQuote.messages || []), message];

    setIsSubmittingMessage(true);
    try {
      const response = await fetch(`/api/admin/quotes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editableQuote, messages: updatedMessages }),
      });

      if (response.ok) {
        toast.success('Message sent successfully');
        setEditableQuote({ ...editableQuote, messages: updatedMessages });
        setQuote({ ...editableQuote, messages: updatedMessages });
        setNewMessage('');
        setAttachments([]);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Error sending message');
    } finally {
      setIsSubmittingMessage(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files));
    }
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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

  if (!quote || !editableQuote) {
    return (
      <ProtectedRoute loadingMessage="Loading quote details...">
        <Container className="py-8">
          <div className="text-center">
            <div className="text-red-600 mb-2">⚠️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Quotation not found
            </h3>
            <Link
              href="/dashboard/quotes"
              className="inline-flex items-center text-theme-color hover:text-theme-color/80"
            >
              <FiArrowLeft className="w-4 h-4 mr-2" />
              Back to Quotes
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
            href="/dashboard/quotes"
            className="inline-flex items-center text-theme-color hover:text-theme-color/80 mb-4"
          >
            <FiArrowLeft className="w-4 h-4 mr-2" />
            Back to Quotations
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <Title className="text-2xl font-bold mb-2">
                Edit Quotation {quote.id}
              </Title>
              <p className="text-gray-600">
                Customer: {quote.email}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span
                className={`px-3 py-1 text-sm font-medium rounded-full capitalize ${
                  quote.status === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : quote.status === "responded"
                    ? "bg-blue-100 text-blue-800"
                    : quote.status === "accepted"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {quote.status}
              </span>
              <button
                onClick={handleSaveQuote}
                disabled={saving}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <FiSave className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('quote')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'quote'
                    ? 'border-theme-color text-theme-color'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FiEdit2 className="inline mr-2 h-4 w-4" />
                Edit Quotation
              </button>
              <button
                onClick={() => setActiveTab('messages')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'messages'
                    ? 'border-theme-color text-theme-color'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FiMessageSquare className="inline mr-2 h-4 w-4" />
                Messages ({editableQuote.messages?.length || 0})
              </button>
            </nav>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'quote' && (
              <div className="space-y-6">
                {/* Products Table */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Products</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full divide-y divide-gray-200 border border-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Product
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Quantity
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Unit Price
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Total
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Notes
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {editableQuote.products.map((product: QuotationProductType, index: number) => {
                          const productData = product.productId ? productsData[product.productId] : null;
                          return (
                            <tr key={index}>
                              <td className="px-4 py-3">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {productData ? productData.title : product.name}
                                  </div>
                                  {productData && (
                                    <div className="text-xs text-gray-500">
                                      SKU: {productData.sku}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="number"
                                  min="1"
                                  value={product.quantity}
                                  onChange={(e) => updateProduct(index, 'quantity', parseInt(e.target.value) || 1)}
                                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={product.unitPrice || ''}
                                  onChange={(e) => updateProduct(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                  className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                  placeholder="0.00"
                                />
                              </td>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                <PriceFormat amount={product.totalPrice || 0} />
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="text"
                                  value={product.notes || ''}
                                  onChange={(e) => updateProduct(index, 'notes', e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                  placeholder="Notes..."
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Summary Section */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Pricing Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subtotal
                      </label>
                      <div className="text-lg font-semibold text-gray-900">
                        <PriceFormat amount={editableQuote.subtotal || 0} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Discount
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editableQuote.discount || ''}
                        onChange={(e) => updateQuoteField('discount', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Delivery Fee
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editableQuote.deliveryFee || ''}
                        onChange={(e) => updateQuoteField('deliveryFee', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-medium text-gray-900">Final Amount</span>
                      <span className="text-2xl font-bold text-indigo-600">
                        <PriceFormat amount={editableQuote.finalAmount || 0} />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Admin Notes */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Admin Notes (Private)</h3>
                  <textarea
                    value={editableQuote.adminNote || ''}
                    onChange={(e) => updateQuoteField('adminNote', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Private notes for admin..."
                  />
                </div>
              </div>
            )}

            {activeTab === 'messages' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Message History</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto mb-6">
                  {editableQuote.messages && editableQuote.messages.length > 0 ? (
                    editableQuote.messages.map((message: QuotationMessage, index: number) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg ${
                          message.sender === "admin"
                            ? "bg-blue-50 ml-8"
                            : "bg-gray-50 mr-8"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-600">
                            {message.sender === "admin" ? "You (Admin)" : "Customer"}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(message.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900">{message.message}</p>
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2 flex items-center space-x-2">
                            <FiPaperclip className="h-4 w-4 text-gray-400" />
                            <span className="text-xs text-gray-600">
                              {message.attachments.length} attachment(s)
                            </span>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-8">No messages yet</p>
                  )}
                </div>

                {/* Send Message */}
                <div className="border-t pt-4">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Send Message to Customer</h4>
                  <div className="space-y-4">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Type your message..."
                    />
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <FiPaperclip className="h-5 w-5 text-gray-400" />
                        <span className="text-sm text-gray-600">Attach files</span>
                        <input
                          type="file"
                          multiple
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                      {attachments.length > 0 && (
                        <span className="text-sm text-gray-500">
                          {attachments.length} file(s) selected
                        </span>
                      )}
                    </div>
                    <button
                      onClick={handleSendMessage}
                      disabled={isSubmittingMessage || !newMessage.trim()}
                      className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {isSubmittingMessage ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <FiSend className="mr-2 h-4 w-4" />
                          Send Message
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quote Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Quotation Information</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium">Status:</span>{" "}
                  <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
                    quote.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : quote.status === "responded"
                      ? "bg-blue-100 text-blue-800"
                      : quote.status === "accepted"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}>
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
                <div>
                  <span className="font-medium">Customer:</span>{" "}
                  {quote.email}
                </div>
                {quote.phone && (
                  <div>
                    <span className="font-medium">Phone:</span>{" "}
                    {quote.phone}
                  </div>
                )}
                {quote.deliveryAddress && (
                  <div>
                    <span className="font-medium">Delivery Address:</span>{" "}
                    {quote.deliveryAddress}
                  </div>
                )}
              </div>
            </div>

            {/* Customer Notes */}
            {quote.userNotes && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Customer Notes</h3>
                <p className="text-sm text-gray-700">{quote.userNotes}</p>
              </div>
            )}

            {/* Attachments */}
            {quote.attachments && quote.attachments.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Customer Attachments</h3>
                <div className="space-y-2">
                  {quote.attachments.map((attachment: string, index: number) => (
                    <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                      <FiPaperclip className="h-4 w-4" />
                      <span>{attachment}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Container>
    </ProtectedRoute>
  );
}