"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { AdminTableSkeleton } from "./AdminSkeletons";
import { toast } from "react-hot-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
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
} from "react-icons/fi";
import ProductForm, { ProductType } from './ProductForm';
import Sidebar from '../account/Sidebar';
import PriceFormat from "@/components/PriceFormat";

interface ProductWithId extends ProductType {
  id: string;
  meta?: {
    createdAt: string;
    updatedAt: string;
    barcode?: string;
    qrCode?: string;
  };
}



export default function AdminProductsClient() {
  const { data: session } = useSession();
  const { user, isAdmin } = useCurrentUser();
  const [products, setProducts] = useState<ProductWithId[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductWithId[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithId | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(20);

  // Modal states
  const [viewProductModal, setViewProductModal] = useState<ProductWithId | null>(null);
  const [deleteProductModal, setDeleteProductModal] = useState<ProductWithId | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<ProductWithId | null>(null);
  const [deleteAllModal, setDeleteAllModal] = useState(false);
  const [deleteSelectedModal, setDeleteSelectedModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Selected products state
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/products");
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter products based on search and filters
  useEffect(() => {
    let filtered = [...products];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.basicInformation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.metadata.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.basicInformation.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(
        (product) => product.basicInformation.category === selectedCategory
      );
    }

    setFilteredProducts(filtered);
    setCurrentPage(1); // Reset to first page when filters change

    // Clear selections when filters change
    setSelectedProducts([]);
    setSelectAll(false);
  }, [products, searchTerm, selectedCategory]);

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

  const handleDeleteProduct = async (product: ProductWithId) => {
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
        await fetchProducts();
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
        await fetchProducts();
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
        await fetchProducts();
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

  const categories = [...new Set(products.map(p => p.basicInformation.category))];

  const handleAddProduct = async (productData: ProductType) => {
    if (!session?.user?.email) return;

    setLoading(true);
    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });
      if (response.ok) {
        setShowCreateModal(false);
        fetchProducts();
        toast.success("Product added successfully!");
      } else {
        toast.error("Failed to add product");
      }
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error("Error adding product");
    }
  };

  const handleEditProduct = async (productData: ProductType) => {
    if (!session?.user?.email) return;

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
        fetchProducts();
        toast.success("Product updated successfully!");
      } else {
        toast.error("Failed to update product");
      }
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Error updating product");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Products Management</h2>
          <div className="h-10 bg-gray-200 rounded animate-pulse w-32"></div>
        </div>
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-16 w-16 bg-gray-200 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="h-8 bg-gray-200 rounded w-20"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
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
            <button
              onClick={fetchProducts}
              className="flex items-center px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
            >
              Refresh
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-3 py-2 bg-theme-color text-white rounded-lg hover:bg-theme-color/80 transition-colors text-sm"
            >
              Add New Product
            </button>
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
                      {product.media.thumbnail ? (
                        <img
                          className="h-12 w-12 rounded-lg object-cover"
                          src={product.media.thumbnail}
                          alt={product.basicInformation.title}
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
                          product.media.thumbnail ? 'hidden' : 'flex'
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
                        {product.basicInformation.title}
                      </div>
                      <div className="text-sm text-gray-500">{product.metadata.brand}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {product.basicInformation.category}
                  </span>
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${product.pricing.price}
                  {product.pricing.discountPercentage > 0 && (
                    <span className="text-green-600 ml-1">
                      (-{product.pricing.discountPercentage}%)
                    </span>
                  )}
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    product.inventory.stock > 10
                      ? 'bg-green-100 text-green-800'
                      : product.inventory.stock > 0
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {product.inventory.stock}
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
                    <button
                      onClick={() => setEditingProduct(product)}
                      className="p-1 text-indigo-600 hover:text-indigo-900 transition-colors"
                      title="Edit"
                    >
                      <FiEdit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product)}
                      className="p-1 text-red-600 hover:text-red-900 transition-colors"
                      title="Delete"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
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
        width="w-96"
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
        width="w-96"
      >
        {editingProduct && (
          <ProductForm
            product={editingProduct}
            onSubmit={handleEditProduct}
            onCancel={() => setEditingProduct(null)}
            loading={loading}
            isEdit={true}
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
                  {viewProductModal.media.thumbnail ? (
                    <img
                      className="h-64 w-92 rounded-lg object-cover"
                      src={viewProductModal.media.thumbnail}
                      alt={viewProductModal.basicInformation.title}
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
                      viewProductModal.media.thumbnail ? 'hidden' : 'flex'
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
                <h4 className="text-xl font-semibold text-gray-900 mt-4">{viewProductModal.basicInformation.title}</h4>
                <p className="text-gray-600">{viewProductModal.metadata.brand}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Product Information</h4>
                <div>
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-900">{viewProductModal.basicInformation.description}</p>
                </div>
              </div>
                <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Product ID
                    </dt>
                    <dd className="text-sm text-gray-900">
                      #{viewProductModal.id.slice(-8)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Category
                    </dt>
                    <dd className="text-sm text-gray-900">
                      {viewProductModal.basicInformation.category}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Price
                    </dt>
                    <dd className="text-sm text-gray-900">
                      <PriceFormat amount={viewProductModal.pricing.price} />
                      {viewProductModal.pricing.discountPercentage > 0 && (
                        <span className="text-green-600 ml-1">
                          (-{viewProductModal.pricing.discountPercentage}%)
                        </span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Stock</dt>
                    <dd className="text-sm text-gray-900">
                      {viewProductModal.inventory.stock}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      SKU
                    </dt>
                    <dd className="text-sm text-gray-900">
                      {viewProductModal.metadata.sku}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Brand</dt>
                    <dd className="text-sm text-gray-900">
                      {viewProductModal.metadata.brand}
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
              {viewProductModal.media.images && viewProductModal.media.images.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900">Gallery Images</h4>
                  <div className="mt-2 flex overflow-x-auto space-x-4">
                    {viewProductModal.media.images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`${viewProductModal.basicInformation.title} ${index + 1}`}
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
                  #{deleteProductModal.id.slice(-8)}
                </strong>
                ?
              </p>
              <div className="mt-3 bg-gray-50 rounded-lg p-3">
                <div className="text-sm text-gray-700">
                  <div>
                    <strong>Title:</strong> {deleteProductModal.basicInformation.title}
                  </div>
                  <div>
                    <strong>Brand:</strong> {deleteProductModal.metadata.brand}
                  </div>
                  <div>
                    <strong>Price:</strong>{" "}
                    <PriceFormat amount={deleteProductModal.pricing.price} />
                  </div>
                  <div>
                    <strong>Stock:</strong> {deleteProductModal.inventory.stock}
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
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete All"}
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
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
