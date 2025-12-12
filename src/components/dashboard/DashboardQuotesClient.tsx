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

// Quote Detail Modal Component
function QuoteDetailModal({
  quote,
  onClose,
  onUpdate
}: {
  quote: QuoteType;
  onClose: () => void;
  onUpdate: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Quote Details
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <FiX size={24} />
            </button>
          </div>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div>
            <h4 className="font-medium text-gray-900">Quote Information</h4>
            <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Quote ID
                </dt>
                <dd className="text-sm text-gray-900">
                  #{quote.id}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Status
                </dt>
                <dd className="text-sm text-gray-900">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
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
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Customer Email
                </dt>
                <dd className="text-sm text-gray-900">
                  {quote.email}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Phone
                </dt>
                <dd className="text-sm text-gray-900">
                  {quote.phone || "Not provided"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Final Amount
                </dt>
                <dd className="text-sm text-gray-900">
                  <PriceFormat amount={quote.finalAmount || 0} />
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Date</dt>
                <dd className="text-sm text-gray-900">
                  {quote.createdAt
                    ? new Date(quote.createdAt).toLocaleString()
                    : "N/A"}
                </dd>
              </div>
            </dl>
          </div>

          {quote.products && quote.products.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900">Products</h4>
              <div className="mt-2 space-y-2">
                {quote.products.map((product, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {product.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Qty: {product.quantity}
                        {product.unitPrice && (
                          <> | Unit: <PriceFormat amount={product.unitPrice} /></>
                        )}
                      </p>
                      {product.notes && (
                        <p className="text-xs text-gray-600 mt-1">
                          Notes: {product.notes}
                        </p>
                      )}
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {product.totalPrice ? (
                        <PriceFormat amount={product.totalPrice} />
                      ) : (
                        "TBD"
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {quote.deliveryAddress && (
            <div>
              <h4 className="font-medium text-gray-900">
                Delivery Address
              </h4>
              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-900">
                  {quote.deliveryAddress}
                </p>
              </div>
            </div>
          )}

          {quote.messages && quote.messages.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900">Messages</h4>
              <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                {quote.messages.map((message, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      message.sender === "admin"
                        ? "bg-blue-50 ml-8"
                        : "bg-gray-50 mr-8"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-600">
                        {message.sender === "admin" ? "Admin" : "Customer"}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(message.timestamp).toLocaleString()}
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
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Quote Edit Modal Component
function QuoteEditModal({
  quote,
  onClose,
  onUpdate
}: {
  quote: QuoteType;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [editableQuote, setEditableQuote] = useState<QuoteType>(quote);
  const [productsData, setProductsData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'quote' | 'messages'>('quote');
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);

  // Fetch product data for products with productId
  useEffect(() => {
    const fetchProductData = async () => {
      const productIds = editableQuote.products
        .filter(p => p.productId)
        .map(p => p.productId);

      if (productIds.length === 0) return;

      try {
        const promises = productIds.map(id =>
          fetch(`/api/products/${id}`).then(res => res.json())
        );
        const products = await Promise.all(promises);
        const productMap: any = {};
        products.forEach(product => {
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
  }, [editableQuote.products]);

  // Calculate totals
  const calculateTotals = (products: QuoteProductType[], discount = 0, deliveryFee = 0) => {
    const subtotal = products.reduce((sum, product) => {
      return sum + (product.unitPrice || 0) * product.quantity;
    }, 0);

    const finalAmount = Math.max(0, subtotal - discount + deliveryFee);

    return { subtotal, finalAmount };
  };

  // Update product field
  const updateProduct = (index: number, field: keyof QuoteProductType, value: any) => {
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
  const updateQuoteField = (field: keyof QuoteType, value: any) => {
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

  // Submit quote changes
  const handleSubmitQuote = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/admin/quotes/${quote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editableQuote),
      });

      if (response.ok) {
        toast.success('Quote updated successfully');
        onUpdate();
        onClose();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update quote');
      }
    } catch (error) {
      console.error('Error updating quote:', error);
      toast.error('Error updating quote');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit message
  const handleSubmitMessage = async () => {
    if (!newMessage.trim()) return;

    const message: QuoteMessage = {
      sender: 'admin',
      message: newMessage,
      timestamp: new Date(),
      attachments: attachments.length > 0 ? attachments.map(f => f.name) : undefined,
    };

    const updatedMessages = [...(editableQuote.messages || []), message];
    const updatedQuote = { ...editableQuote, messages: updatedMessages };

    setSubmitting(true);
    try {
      const response = await fetch(`/api/admin/quotes/${quote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedQuote),
      });

      if (response.ok) {
        toast.success('Message sent successfully');
        setEditableQuote(updatedQuote);
        setNewMessage('');
        setAttachments([]);
        onUpdate();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Error sending message');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-7xl w-full max-h-screen overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Edit Quote #{quote.id}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <FiX size={24} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('quote')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                activeTab === 'quote'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Edit Quote
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                activeTab === 'messages'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Messages ({editableQuote.messages?.length || 0})
            </button>
          </div>
        </div>

        <div className="px-6 py-4">
          {activeTab === 'quote' && (
            <div className="space-y-6">
              {/* Products Table */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Products</h4>
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
                      {editableQuote.products.map((product, index) => {
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
              <div className="bg-gray-50 p-4 rounded-lg">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes (Private)
                </label>
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
            <div className="space-y-6">
              {/* Messages History */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Message History</h4>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {editableQuote.messages && editableQuote.messages.length > 0 ? (
                    editableQuote.messages.map((message, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg ${
                          message.sender === 'admin'
                            ? 'bg-blue-50 ml-8'
                            : 'bg-gray-50 mr-8'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-600">
                            {message.sender === 'admin' ? 'You' : 'Customer'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(message.timestamp).toLocaleString()}
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
              </div>

              {/* Send Message */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Send Message</h4>
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
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={submitting}
          >
            Cancel
          </button>
          {activeTab === 'quote' && (
            <button
              onClick={handleSubmitQuote}
              disabled={submitting}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center"
            >
              {submitting ? (
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
          )}
          {activeTab === 'messages' && (
            <button
              onClick={handleSubmitMessage}
              disabled={submitting || !newMessage.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <FiMessageSquare className="mr-2 h-4 w-4" />
                  Send Message
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

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
