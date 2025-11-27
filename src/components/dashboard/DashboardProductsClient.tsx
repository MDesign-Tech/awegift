"use client";

import { useState, useEffect, useRef } from "react";
import { TableSkeleton } from "./Skeletons";
import { toast } from "react-hot-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { UserRole, hasPermission } from "@/lib/rbac/roles";
import { useInfiniteProducts, useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import {
  FiPlus,
  FiSearch,
  FiFilter,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiRefreshCw,
  FiSave,
  FiX,
  FiLoader,
} from "react-icons/fi";
import ProductForm from './ProductForm';
import Sidebar from '../account/Sidebar';
import PriceFormat from "@/components/PriceFormat";
import { ProductType } from '../../../type';

export default function DashboardProductsClient() {
  const { user, isAdmin, userRole } = useCurrentUser();
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  // Use the infinite products hook
  const {
    products: allProducts,
    loading: initialLoading,
    loadingMore,
    hasMore,
    loadMore,
    reset: resetProducts,
    refetch: refetchProducts,
  } = useInfiniteProducts("/api/admin/products", 20, hasSearched ? searchTerm : undefined, selectedCategory || undefined);

  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setHasSearched(term.trim().length > 0);
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm("");
    setHasSearched(false);
  };

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductType | null>(null);

  // Modal states
  const [viewProductModal, setViewProductModal] = useState<ProductType | null>(null);
  const [deleteProductModal, setDeleteProductModal] = useState<ProductType | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<ProductType | null>(null);
  const [deleteAllModal, setDeleteAllModal] = useState(false);
  const [deleteSelectedModal, setDeleteSelectedModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Selected products state
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Ref for scrollable container
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Handle refresh with loading state
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetchProducts();
      toast.success("Products refreshed successfully");
    } catch (error) {
      toast.error("Failed to refresh products");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Set initial loading to false when products are loaded
  useEffect(() => {
    if (allProducts.length > 0 || !initialLoading) {
      setLoading(false);
    }
  }, [allProducts, initialLoading]);

  // Products are already filtered by the API
  const categoryFilteredProducts = allProducts;

  // Reset selection when filters change
  useEffect(() => {
    setSelectedProducts([]);
    setSelectAll(false);
  }, [selectedCategory, searchTerm, hasSearched]);

  // Update selectAll state based on selected products
  useEffect(() => {
    if (allProducts.length > 0) {
      // Check if all visible products are selected
      const allVisibleSelected = allProducts.every(product =>
        selectedProducts.includes(product.id)
      );
      setSelectAll(allVisibleSelected);
    } else {
      setSelectAll(false);
    }
  }, [selectedProducts, allProducts]);

  const handleDeleteProduct = async (product: ProductType) => {
    setDeleteProductModal(product);
  };

  const confirmDeleteProduct = async () => {
    if (!deleteProductModal) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/products/${String(deleteProductModal.id)}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Product deleted successfully");
        await refetchProducts();
        setDeleteProductModal(null);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to delete product");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Error deleting product");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAllProducts = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch("/api/admin/products/bulk-delete", {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("All products deleted successfully");
        await refetchProducts();
        setDeleteAllModal(false);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to delete all products");
      }
    } catch (error) {
      console.error("Error deleting all products:", error);
      toast.error("Error deleting all products");
    } finally {
      setIsDeleting(false);
    }
  };

  // Selection handlers
  const handleSelectProduct = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  // Handle select all visible products
  const handleSelectAll = () => {
    if (selectAll) {
      // Deselect all visible products
      const visibleIds = allProducts.map(product => product.id);
      setSelectedProducts(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      // Select all visible products
      const visibleIds = allProducts.map(product => product.id);
      const newSelected = [...new Set([...selectedProducts, ...visibleIds])];
      setSelectedProducts(newSelected);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedProducts.length === 0) {
      toast.error("Please select products to delete");
      return;
    }
    setDeleteSelectedModal(true);
  };

  const confirmDeleteSelected = async () => {
    if (selectedProducts.length === 0) return;

    setIsDeleting(true);
    try {
      const response = await fetch("/api/admin/products/bulk-delete-selected", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productIds: selectedProducts }),
      });

      if (response.ok) {
        toast.success(`Successfully deleted ${selectedProducts.length} products`);
        setSelectedProducts([]);
        setSelectAll(false);
        await refetchProducts();
        setDeleteSelectedModal(false);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to delete selected products");
      }
    } catch (error) {
      console.error("Error deleting selected products:", error);
      toast.error("Error deleting selected products");
    } finally {
      setIsDeleting(false);
    }
  };

  // Infinite scroll setup
  useInfiniteScroll(loadMore, hasMore, loadingMore || initialLoading, scrollContainerRef);

  const categories = [...new Set(allProducts.map(p => p.category))];

  // Show loading skeleton for initial load
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Loading Products...
            </h2>
          </div>
        </div>
        <TableSkeleton rows={10} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden relative">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center flex-wrap justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Products Management ({allProducts.length}{hasMore ? '+' : ''})
          </h2>
          <div className="grid grid-cols-2 items-center sm:flex sm:grid-cols-none gap-2">
            {hasPermission(userRole as UserRole, "canDeleteProducts") && (
              <>
                <button
                  onClick={handleDeleteSelected}
                  className="flex items-center px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm disabled:opacity-50"
                  disabled={selectedProducts.length === 0 || isRefreshing}
                >
                  Delete Selected ({selectedProducts.length})
                </button>
                <button
                  onClick={() => setDeleteAllModal(true)}
                  className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm disabled:opacity-50"
                  disabled={allProducts.length === 0 || isRefreshing}
                >
                  Delete All
                </button>
              </>
            )}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm disabled:opacity-50"
            >
              <FiRefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            {hasPermission(userRole as UserRole, "canCreateProducts") && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center px-3 py-2 bg-theme-color text-white rounded-lg hover:bg-theme-color/80 transition-colors text-sm disabled:opacity-50"
                disabled={isRefreshing}
              >
                <FiPlus className="mr-2 h-4 w-4" />
                Add New Product
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-color focus:border-transparent disabled:opacity-50"
                disabled={isRefreshing}
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  disabled={isRefreshing}
                >
                  <FiX className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-color focus:border-transparent disabled:opacity-50"
              disabled={isRefreshing}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div ref={scrollContainerRef} className="overflow-x-auto relative max-h-[600px] overflow-y-auto">
        {/* Show refreshing overlay */}
        {isRefreshing && (
          <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10">
            <div className="text-center">
              <FiRefreshCw className="animate-spin mx-auto h-8 w-8 text-indigo-600 mb-2" />
              <p className="text-sm text-gray-600">Refreshing products...</p>
            </div>
          </div>
        )}
        
        <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                  disabled={isRefreshing || allProducts.length === 0}
                />
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                Product
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                Category
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                Price
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                Stock
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                Rating
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categoryFilteredProducts.map((product, index) => (
              <tr key={`${product.id}-${index}`} className="hover:bg-gray-50">
                <td className="px-3 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(product.id)}
                    onChange={() => handleSelectProduct(product.id)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                    disabled={isRefreshing}
                  />
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-12 w-12">
                      {product.thumbnail ? (
                        <img
                          className="h-12 w-12 rounded-lg object-cover"
                          src={product.thumbnail}
                          alt={product.title}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            if (e.currentTarget.nextElementSibling) {
                              (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <div
                        className={`h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center ${
                          product.thumbnail ? 'hidden' : 'flex'
                        }`}
                      >
                        <svg
                          className="h-6 w-6 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {product.title}
                      </div>
                      <div className="text-sm text-gray-500">{product.brand}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {product.category}
                  </span>
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${product.price}
                  {product.discountPercentage > 0 && (
                    <span className="text-green-600 ml-1">
                      (-{product.discountPercentage}%)
                    </span>
                  )}
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    product.stock > 10
                      ? 'bg-green-100 text-green-800'
                      : product.stock > 0
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {product.stock}
                  </span>
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                  ⭐ 0.0
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setViewProductModal(product)}
                      className="p-1 text-blue-600 hover:text-blue-900 transition-colors disabled:opacity-50"
                      title="View"
                      disabled={isRefreshing}
                    >
                      <FiEye className="h-4 w-4" />
                    </button>
                    {hasPermission(userRole as UserRole, "canUpdateProducts") && (
                      <button
                        onClick={() => setEditingProduct(product)}
                        className="p-1 text-indigo-600 hover:text-indigo-900 transition-colors disabled:opacity-50"
                        title="Edit"
                        disabled={isRefreshing}
                      >
                        <FiEdit2 className="h-4 w-4" />
                      </button>
                    )}
                    {hasPermission(userRole as UserRole, "canDeleteProducts") && (
                      <button
                        onClick={() => handleDeleteProduct(product)}
                        className="p-1 text-red-600 hover:text-red-900 transition-colors disabled:opacity-50"
                        title="Delete"
                        disabled={isRefreshing}
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Loading State for initial load */}
      {initialLoading && (
        <div className="px-6 py-12 text-center">
          <FiLoader className="mx-auto h-8 w-8 text-gray-400 animate-spin" />
          <p className="mt-2 text-sm text-gray-500">Loading products...</p>
        </div>
      )}

      {/* Empty State - only show when not loading and truly no products */}
      {allProducts.length === 0 && !initialLoading && !loadingMore && !isRefreshing && (
        <div className="px-6 py-12 text-center">
          <FiSearch className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || selectedCategory
              ? "Try adjusting your search or filter criteria."
              : "Get started by adding your first product."}
          </p>
        </div>
      )}

      {/* Loading More Indicator */}
      {loadingMore && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-center">
            <FiLoader className="animate-spin h-5 w-5 text-gray-500 mr-2" />
            <span className="text-sm text-gray-600">Loading more products...</span>
          </div>
        </div>
      )}

      {/* Products Count */}
      <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
        <div className="text-sm text-gray-700">
          Showing {allProducts.length} products
          {selectedProducts.length > 0 && (
            <span className="ml-2 text-orange-600 font-medium">
              • {selectedProducts.length} selected
            </span>
          )}
          {!hasMore && categoryFilteredProducts.length > 0 && (
            <span className="ml-2 text-green-600 font-medium">
              • All products loaded
            </span>
          )}
        </div>
      </div>

      {/* Add Product Sidebar */}
      <Sidebar
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New Product"
        width="w-[600px]"
      >
        <ProductForm
          onCancel={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
          }}
          refetchProducts={refetchProducts}
        />
      </Sidebar>

      {/* Edit Product Sidebar */}
      <Sidebar
        isOpen={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        title="Edit Product"
        width="w-[600px]"
      >
        {editingProduct && (
          <ProductForm
            product={editingProduct}
            onCancel={() => setEditingProduct(null)}
            onSuccess={() => {
              setEditingProduct(null);
              refetchProducts();
            }}
            refetchProducts={refetchProducts}
          />
        )}
      </Sidebar>

      {/* View Product Modal */}
      {viewProductModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-11/12 overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Product Details
                </h3>
                <button
                  onClick={() => setViewProductModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX size={24} />
                </button>
              </div>
            </div>
            <div className=" flex px-6 py-4 space-y-4">
            <div className="flex flex-wrap gap-3">
              <div className="text-center">
                <div className="flex-shrink-0 h-64 w-92 mx-auto">
                  {viewProductModal.thumbnail ? (
                    <img
                      className="h-64 w-92 rounded-lg object-cover"
                      src={viewProductModal.thumbnail}
                      alt={viewProductModal.title}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            if (e.currentTarget.nextElementSibling) {
                              (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                            }
                          }}
                    />
                  ) : null}
                  <div
                    className={`h-64 w-92 rounded-lg bg-gray-100 flex items-center justify-center ${
                      viewProductModal.thumbnail ? 'hidden' : 'flex'
                    }`}
                  >
                    <svg
                      className="h-16 w-16 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mt-4">{viewProductModal.title}</h4>
                <p className="text-gray-600">{viewProductModal.brand}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Product Information</h4>
                <div>
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-900">{(viewProductModal as any).description}</p>
                </div>
              </div>
                <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Product ID
                    </dt>
                    <dd className="text-sm text-gray-900">
                      #{String(viewProductModal.id).slice(-8)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Category
                    </dt>
                    <dd className="text-sm text-gray-900">
                      {viewProductModal.category}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Price
                    </dt>
                    <dd className="text-sm text-gray-900">
                      <PriceFormat amount={viewProductModal.price} />
                      {viewProductModal.discountPercentage > 0 && (
                        <span className="text-green-600 ml-1">
                          (-{viewProductModal.discountPercentage}%)
                        </span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Stock</dt>
                    <dd className="text-sm text-gray-900">
                      {viewProductModal.stock}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      SKU
                    </dt>
                    <dd className="text-sm text-gray-900">
                      {viewProductModal.sku}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Brand</dt>
                    <dd className="text-sm text-gray-900">
                      {viewProductModal.brand}
                    </dd>
                  </div>
                  {viewProductModal.meta && (
                    <>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">
                          Created At
                        </dt>
                        <dd className="text-sm text-gray-900">
                          {new Date(viewProductModal.meta.createdAt).toLocaleString()}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">
                          Updated At
                        </dt>
                        <dd className="text-sm text-gray-900">
                          {new Date(viewProductModal.meta.updatedAt).toLocaleString()}
                        </dd>
                      </div>
                    </>
                  )}
                </dl>
              </div>
              </div>
              {viewProductModal.images && viewProductModal.images.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900">Gallery Images</h4>
                  <div className="mt-2 flex overflow-x-auto space-x-4">
                    {viewProductModal.images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`${viewProductModal.title} ${index + 1}`}
                        className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex justify-end">
                <button
                  onClick={() => setViewProductModal(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Product Modal */}
      {deleteProductModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="px-6 py-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <FiTrash2 className="mr-2 h-5 w-5 text-red-600" />
                Delete Product
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Are you sure you want to delete product{" "}
                <strong>
                  #{String(deleteProductModal.id).slice(-8)}
                </strong>
                ?
              </p>
              <div className="mt-3 bg-gray-50 rounded-lg p-3">
                <div className="text-sm text-gray-700">
                  <div>
                    <strong>Title:</strong> {deleteProductModal.title}
                  </div>
                  <div>
                    <strong>Brand:</strong> {deleteProductModal.brand}
                  </div>
                  <div>
                    <strong>Price:</strong>{" "}
                    <PriceFormat amount={deleteProductModal.price} />
                  </div>
                  <div>
                    <strong>Stock:</strong> {deleteProductModal.stock}
                  </div>
                </div>
              </div>
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">
                  <strong>Warning:</strong> This action cannot be undone. The
                  product will be permanently removed from the database.
                </p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setDeleteProductModal(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteProduct}
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
                    Delete Product
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Products Modal */}
      {deleteAllModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="px-6 py-4">
              <h3 className="text-lg font-medium text-gray-900">
                Delete All Products
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Are you sure you want to delete ALL products? This action will
                remove all products from the products collection. This action cannot be undone.
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
                onClick={handleDeleteAllProducts}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <FiLoader className="animate-spin mr-2 h-4 w-4" />
                    Deleting...
                  </>
                ) : "Delete All"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Selected Products Modal */}
      {deleteSelectedModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="px-6 py-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <FiTrash2 className="mr-2 h-5 w-5 text-red-600" />
                Delete Selected Products
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Are you sure you want to delete{" "}
                <strong>{selectedProducts.length}</strong> selected products? This
                action will permanently remove these products from the database
                and cannot be undone.
              </p>
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Warning:</strong> This will delete the products from
                  the products collection in the database.
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
                    Delete {selectedProducts.length} Products
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