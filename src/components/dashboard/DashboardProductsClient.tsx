"use client";

import { useState, useEffect } from "react";
import { TableSkeleton } from "./Skeletons";
import { toast } from "react-hot-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { UserRole, hasPermission } from "@/lib/rbac/roles";
import { useProductSearch } from "@/hooks/useProductSearch";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
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
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");

  // Use the product search hook
  const {
    search: searchTerm,
    setSearch: setSearchTerm,
    products,
    filteredProducts,
    suggestedProducts,
    isLoading: searchLoading,
    hasSearched,
    clearSearch,
    refetchProducts,
  } = useProductSearch();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductType | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(20);

  // Infinite scroll states
  const [hasMoreProducts, setHasMoreProducts] = useState(true);
  const [infiniteProducts, setInfiniteProducts] = useState<ProductType[]>([]);
  const [infiniteLoading, setInfiniteLoading] = useState(false);

  // Modal states
  const [viewProductModal, setViewProductModal] = useState<ProductType | null>(null);
  const [deleteProductModal, setDeleteProductModal] = useState<ProductType | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<ProductType | null>(null);
  const [deleteAllModal, setDeleteAllModal] = useState(false);
  const [deleteSelectedModal, setDeleteSelectedModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Selected products state
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Products are loaded by useProductSearch hook

  // Additional category filtering (search is handled by useProductSearch)
  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
    // Clear selections when filters change
    setSelectedProducts([]);
    setSelectAll(false);
  }, [selectedCategory]);

  // Load more products for infinite scroll
  const loadMoreProducts = async () => {
    if (infiniteLoading || !hasMoreProducts) return;

    setInfiniteLoading(true);
    try {
      // In a real implementation, you'd fetch more products from API
      // For now, we'll just add more from the existing products
      const currentLength = infiniteProducts.length;
      const nextBatch = products.slice(currentLength, currentLength + 20);

      if (nextBatch.length === 0) {
        setHasMoreProducts(false);
      } else {
        setInfiniteProducts(prev => [...prev, ...nextBatch]);
      }
    } catch (error) {
      console.error("Error loading more products:", error);
    } finally {
      setInfiniteLoading(false);
    }
  };

  // Use infinite scroll hook
  useInfiniteScroll(loadMoreProducts, hasMoreProducts, infiniteLoading);

  // Calculate pagination
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  // Update selectAll state based on selected products
  useEffect(() => {
    if (currentProducts.length > 0) {
      const allCurrentProductsSelected = currentProducts.every((product) =>
        selectedProducts.includes(product.id)
      );
      setSelectAll(allCurrentProductsSelected && selectedProducts.length > 0);
    } else {
      setSelectAll(false);
    }
  }, [selectedProducts, currentProducts]);

  const handleDeleteProduct = async (product: ProductType) => {
    setDeleteProductModal(product);
  };

  const confirmDeleteProduct = async () => {
    if (!deleteProductModal) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/products/${deleteProductModal.id}`, {
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
  const handleSelectProduct = (productId: number) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(currentProducts.map((product) => product.id));
    }
    setSelectAll(!selectAll);
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

  const categories = [...new Set(products.map(p => p.category))];

  const handleAddProduct = async (productData: ProductType): Promise<void> => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch(`https://dummyjson.com/products?limit=0`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });
      if (response.ok) {
        setShowCreateModal(false);
        refetchProducts();
        toast.success("Product added successfully!");
      } else {
        toast.error("Failed to add product");
      }
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error("Error adding product");
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = async (productData: ProductType): Promise<void> => {
    if (!user) return;

    setLoading(true);
    if (!editingProduct) return;

    try {
      const response = await fetch(`/api/admin/products/${editingProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });
      if (response.ok) {
        setEditingProduct(null);
        refetchProducts();
        toast.success("Product updated successfully!");
      } else {
        toast.error("Failed to update product");
      }
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Error updating product");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <TableSkeleton rows={10} />;
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex  items-center flex-wrap justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Products Management ({filteredProducts.length})
          </h2>
          <div className="grid grid-cols-2 items-center sm:flex sm:grid-cols-none gap-2">
            {hasPermission(userRole as UserRole, "canDeleteProducts") && (
              <>
                <button
                  onClick={handleDeleteSelected}
                  className="flex items-center px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                  disabled={selectedProducts.length === 0}
                >
                  Delete Selected ({selectedProducts.length})
                </button>
                <button
                  onClick={() => setDeleteAllModal(true)}
                  className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                  disabled={products.length === 0}
                >
                  Delete All
                </button>
              </>
            )}
            <button
              onClick={refetchProducts}
              className="flex items-center px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
            >
              Refresh
            </button>
            {hasPermission(userRole as UserRole, "canCreateProducts") && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center px-3 py-2 bg-theme-color text-white rounded-lg hover:bg-theme-color/80 transition-colors text-sm"
              >
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
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-color focus:border-transparent"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-color focus:border-transparent"
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
      <div className="overflow-x-auto">
        <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                <input
                  type="checkbox"
                  checked={selectAll && currentProducts.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
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
            {currentProducts.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-3 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(product.id)}
                    onChange={() => handleSelectProduct(product.id)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
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
                      className="p-1 text-blue-600 hover:text-blue-900 transition-colors"
                      title="View"
                    >
                      <FiEye className="h-4 w-4" />
                    </button>
                    {hasPermission(userRole as UserRole, "canUpdateProducts") && (
                      <button
                        onClick={() => setEditingProduct(product)}
                        className="p-1 text-indigo-600 hover:text-indigo-900 transition-colors"
                        title="Edit"
                      >
                        <FiEdit2 className="h-4 w-4" />
                      </button>
                    )}
                    {hasPermission(userRole as UserRole, "canDeleteProducts") && (
                      <button
                        onClick={() => handleDeleteProduct(product)}
                        className="p-1 text-red-600 hover:text-red-900 transition-colors"
                        title="Delete"
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

      {/* Empty State */}
      {filteredProducts.length === 0 && !loading && (
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

      {/* Pagination */}
      {filteredProducts.length > productsPerPage && (
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {indexOfFirstProduct + 1} to{" "}
              {Math.min(indexOfLastProduct, filteredProducts.length)} of{" "}
              {filteredProducts.length} results
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

      {/* Add Product Sidebar */}
      <Sidebar
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New Product"
        width="w-[600px]"
      >
        <ProductForm
          onSubmit={handleAddProduct}
          onCancel={() => setShowCreateModal(false)}
          loading={loading}
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
            onSubmit={handleEditProduct}
            onCancel={() => setEditingProduct(null)}
            loading={loading}
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
