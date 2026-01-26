"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Container from "@/components/Container";
import Title from "@/components/Title";
import PriceFormat from "@/components/PriceFormat";
import RoleProtectedRoute from "@/components/auth/RoleProtectedRoute";
import {
  FiSave,
  FiArrowLeft,
  FiPaperclip,
} from "react-icons/fi";
import Link from "next/link";
import { QuotationType, QuotationProductType } from "../../../../../../type";
import { toast } from "react-hot-toast";
import { formatNotificationDate } from "@/lib/date";

export default function AdminQuoteDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [quote, setQuote] = useState<QuotationType | null>(null);
  const [editableQuote, setEditableQuote] = useState<QuotationType | null>(null);
  const [productsData, setProductsData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'quote'>('quote');

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

  // Adjust quantities based on available stock
  useEffect(() => {
    if (editableQuote && Object.keys(productsData).length > 0) {
      const updatedProducts = editableQuote.products.map((product: QuotationProductType) => {
        if (product.productId && productsData[product.productId]) {
          const stock = productsData[product.productId].stock || 0;
          const adjustedQuantity = Math.min(product.quantity, stock);
          if (adjustedQuantity !== product.quantity) {
            toast(`Quantity for ${productsData[product.productId].title} adjusted to available stock (${stock})`, { icon: '⚠️' });
          }
          return {
            ...product,
            quantity: adjustedQuantity,
            totalPrice: (product.unitPrice || 0) * adjustedQuantity,
          };
        }
        return product;
      });

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
    }
  }, [productsData, editableQuote?.id]);

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
    const product = updatedProducts[index];

    if (field === 'quantity') {
      const numValue = parseInt(value) || 1;
      if (product.productId && productsData[product.productId]) {
        const stock = productsData[product.productId].stock || 0;
        if (numValue > stock) {
          toast.error(`Cannot set quantity above available stock (${stock})`);
          return;
        }
      }
      updatedProducts[index] = { ...product, [field]: numValue };
    } else {
      updatedProducts[index] = { ...product, [field]: value };
    }

    // Recalculate total price for the product
    if (field === 'unitPrice' || field === 'quantity') {
      const updatedProduct = updatedProducts[index];
      updatedProducts[index].totalPrice = (updatedProduct.unitPrice || 0) * updatedProduct.quantity;
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
    return (
      <RoleProtectedRoute allowedRoles={["admin"]} loadingMessage="Loading quote details...">
        <Container className="py-4 md:py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </Container>
      </RoleProtectedRoute>
    );
  }

  if (!quote || !editableQuote) {
    return (
      <RoleProtectedRoute allowedRoles={["admin"]} loadingMessage="Loading quote details...">
        <Container className="py-4 md:py-8">
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
      </RoleProtectedRoute>
    );
  }

  return (
    <RoleProtectedRoute allowedRoles={["admin"]} loadingMessage="Loading quote details...">
      <Container className="py-4 md:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard/quotes"
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FiArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                  Edit Quotation {quote.id}
                </h1>
                <p className="text-gray-600 text-sm md:text-base">
                  Customer: {quote.email}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              
              <button
                onClick={handleSaveQuote}
                disabled={saving}
                className="flex items-center px-4 py-2 bg-theme-color text-white rounded-lg hover:bg-accent-color transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Responding...
                  </>
                ) : (
                  <>
                    <FiSave className="mr-2 h-4 w-4" />
                    Respond
                  </>
                )}
              </button>
            </div>
          </div>
        </div>


        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
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
                                max={product.productId && productsData[product.productId] ? productsData[product.productId].stock : undefined}
                                value={product.quantity}
                                onChange={(e) => updateProduct(index, 'quantity', parseInt(e.target.value) || 1)}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-theme-color focus:border-theme-color"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={product.unitPrice || ''}
                                onChange={(e) => updateProduct(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-theme-color focus:border-theme-color"
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
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-theme-color focus:border-theme-color"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-theme-color focus:border-theme-color"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-theme-color focus:border-theme-color"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-gray-900">Final Amount</span>
                    <span className="text-2xl font-extrabold">
                      <PriceFormat amount={editableQuote.finalAmount || 0} />
                    </span>
                  </div>
                </div>
              </div>

              {/* Admin Notes */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Admin Notes </h3>
                <textarea
                  value={editableQuote.adminNote || ''}
                  onChange={(e) => updateQuoteField('adminNote', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-theme-color focus:border-theme-color"
                  placeholder="Private notes for admin..."
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quote Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Quotation Information</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium">Status:</span>{" "}
                  <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(
                    quote.status
                  )}`}>
                    {quote.status.replace(/_/g, " ")}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Submitted:</span>{" "}
                  {formatNotificationDate(quote.createdAt)}
                </div>
                <div>
                  <span className="font-medium">Valid Until:</span>{" "}
                  {formatNotificationDate(quote.validUntil)}
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
    </RoleProtectedRoute>
  );
}