"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useDispatch } from "react-redux";
import { addToCart } from "@/redux/aweGiftSlice";
import Container from "@/components/Container";
import Title from "@/components/Title";
import PriceFormat from "@/components/PriceFormat";
import RoleProtectedRoute from "@/components/auth/RoleProtectedRoute";
import {
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiArrowLeft,
  FiShoppingCart,
  FiLoader,
} from "react-icons/fi";
import Link from "next/link";
import { QuotationType, QuotationProductType } from "../../../../../../type";
import { getStatusDisplayInfo } from "@/lib/quoteStatuses";

export default function QuoteDetailPage() {
  const { id } = useParams();
  const { data: session } = useSession();
  const dispatch = useDispatch();
  const [quote, setQuote] = useState<QuotationType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productsData, setProductsData] = useState<any>({});
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => {
    if (id && session?.user?.email) {
      fetchQuote();
    }
  }, [id, session?.user?.email]);

  // Fetch product data for products with productId
  useEffect(() => {
    if (quote) {
      const fetchProductData = async () => {
        const productIds: string[] = quote.products
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
  }, [quote]);

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


  const handleAcceptQuote = async () => {
    if (!quote) return;

    setAccepting(true);
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
    } finally {
      setAccepting(false);
    }
  };

  const handleRejectQuote = async () => {
    if (!quote) return;

    setRejecting(true);
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
    } finally {
      setRejecting(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!quote) return;

    setPlacingOrder(true);
    try {
      // Add quotation products to cart, excluding custom products
      const productsToAdd = quote.products.filter(p => p.productId); // Only standard products

      for (const product of productsToAdd) {
        // Fetch product data
        const productResponse = await fetch(`/api/products/${product.productId}`);
        if (!productResponse.ok) continue;
        const productData = await productResponse.json();

        // Override price with quoted unitPrice
        const quotedProduct = {
          ...productData,
          price: product.unitPrice || productData.price,
          quantity: product.quantity,
        };

        // Add to cart using Redux
        dispatch(addToCart(quotedProduct));
      }

      // Redirect to checkout
      window.location.href = '/cart';
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order');
    } finally {
      setPlacingOrder(false);
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return "Invalid Date";
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const canAcceptReject = quote?.status === "responded";

  if (loading) {
    return (
      <RoleProtectedRoute allowedRoles={["user", "admin"]} loadingMessage="Loading quote details...">
        <Container className="py-4 md:py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </Container>
      </RoleProtectedRoute>
    );
  }

  if (error || !quote) {
    return (
      <RoleProtectedRoute allowedRoles={["user", "admin"]} loadingMessage="Loading quote details...">
        <Container className="py-4 md:py-8">
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
      </RoleProtectedRoute>
    );
  }

  return (
    <RoleProtectedRoute allowedRoles={["user", "admin"]} loadingMessage="Loading quote details...">
      <Container className="py-4 md:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <Link
                href="/account/quotes"
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FiArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                  Quotation {quote.id}
                </h1>
                <p className="text-gray-600 text-sm md:text-base">
                  Submitted on {formatDate(quote.createdAt)}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                className={`px-4 py-2 text-sm font-medium rounded-lg border capitalize cursor-default w-full sm:w-auto ${getStatusDisplayInfo(quote.status).color}`}
                disabled
              >
                {quote.status}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col  gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
            {/* Products */}
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
                    {quote.products.map((product: QuotationProductType, index: number) => {
                      const productData = product.productId ? productsData[product.productId] : null;
                      return (
                        <tr key={index}>
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              {(() => {
                                const image = product.productId ? productsData[product.productId]?.thumbnail : null;
                                return image ? (
                                  <img src={image} alt={product.name} className="w-10 h-10 rounded object-cover mr-3" />
                                ) : (
                                  <div className="w-10 h-10 bg-gray-300 rounded flex items-center justify-center mr-3">
                                    <span className="text-sm font-medium text-gray-600">
                                      {product.name?.charAt(0)?.toUpperCase() || "P"}
                                    </span>
                                  </div>
                                );
                              })()}
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
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-900">{product.quantity}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-900">
                              <PriceFormat amount={product.unitPrice || 0} />
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            <PriceFormat amount={product.totalPrice || 0} />
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-900">{product.notes || '—'}</span>
                          </td>
                        </tr>
                      );
                    })}
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
                    disabled={accepting}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    {accepting ? (
                      <>
                        <FiLoader className="animate-spin w-4 h-4 mr-2" />
                        Accepting...
                      </>
                    ) : (
                      <>
                        <FiCheckCircle className="w-4 h-4 mr-2" />
                        Accept Quotation
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleRejectQuote}
                    disabled={rejecting}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    {rejecting ? (
                      <>
                        <FiLoader className="animate-spin w-4 h-4 mr-2" />
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <FiXCircle className="w-4 h-4 mr-2" />
                        Reject Quotation
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Place Order */}
            {quote.status === "accepted" && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Place Order</h3>
                <p className="text-sm text-gray-600 mb-4">
                  You have accepted this quotation. You can now place an order using the quoted prices.
                </p>
                <button
                  onClick={() => handlePlaceOrder()}
                  disabled={placingOrder}
                  className="w-full bg-theme-color text-white py-2 px-4 rounded-lg hover:bg-theme-color/90 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {placingOrder ? (
                    <>
                      <FiLoader className="animate-spin w-4 h-4 mr-2" />
                      Placing Order...
                    </>
                  ) : (
                    <>
                      <FiShoppingCart className="w-4 h-4 mr-2" />
                      Place Order
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </Container>
    </RoleProtectedRoute>
  );
}
