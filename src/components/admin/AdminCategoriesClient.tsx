"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { AdminTableSkeleton } from "./AdminSkeletons";
import { toast } from "react-hot-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { hasPermission } from "@/lib/rbac/roles";
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
import CategoryForm, { CategoryType } from './CategoryForm';
import Sidebar from '../account/Sidebar';

interface CategoryWithId extends CategoryType {
  id: string;
  productCount?: number;
  meta?: {
    createdAt: string;
    updatedAt: string;
  };
}

export default function AdminCategoriesClient() {
  const { data: session } = useSession();
  const { user, isAdmin } = useCurrentUser();
  const [userRole, setUserRole] = useState<string>("");
  const [categories, setCategories] = useState<CategoryWithId[]>([]);

  // Fetch user role
  useEffect(() => {
    if (session?.user?.email) {
      fetchUserRole();
    }
  }, [session?.user?.email]);

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
  const [filteredCategories, setFilteredCategories] = useState<CategoryWithId[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [categoriesPerPage] = useState(20);

  // Modal states
  const [viewCategoryModal, setViewCategoryModal] = useState<CategoryWithId | null>(null);
  const [deleteCategoryModal, setDeleteCategoryModal] = useState<CategoryWithId | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<CategoryWithId | null>(null);
  const [deleteAllModal, setDeleteAllModal] = useState(false);
  const [deleteSelectedModal, setDeleteSelectedModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Selected categories state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Form states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryWithId | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter categories based on search
  useEffect(() => {
    let filtered = [...categories];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (category) =>
          category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          category.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
          category.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredCategories(filtered);
    setCurrentPage(1); // Reset to first page when filters change

    // Clear selections when filters change
    setSelectedCategories([]);
    setSelectAll(false);
  }, [categories, searchTerm]);

  // Calculate pagination
  const indexOfLastCategory = currentPage * categoriesPerPage;
  const indexOfFirstCategory = indexOfLastCategory - categoriesPerPage;
  const currentCategories = filteredCategories.slice(
    indexOfFirstCategory,
    indexOfLastCategory
  );
  const totalPages = Math.ceil(filteredCategories.length / categoriesPerPage);

  // Update selectAll state based on selected categories
  useEffect(() => {
    if (currentCategories.length > 0) {
      const allCurrentCategoriesSelected = currentCategories.every((category) =>
        selectedCategories.includes(category.id)
      );
      setSelectAll(allCurrentCategoriesSelected && selectedCategories.length > 0);
    } else {
      setSelectAll(false);
    }
  }, [selectedCategories, currentCategories]);

  const handleDeleteCategory = async (category: CategoryWithId) => {
    setDeleteCategoryModal(category);
  };

  const confirmDeleteCategory = async () => {
    if (!deleteCategoryModal) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/categories/${deleteCategoryModal.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Category deleted successfully");
        await fetchCategories();
        setDeleteCategoryModal(null);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to delete category");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Error deleting category");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAllCategories = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch("/api/admin/categories/bulk-delete", {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("All categories deleted successfully");
        await fetchCategories();
        setDeleteAllModal(false);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to delete all categories");
      }
    } catch (error) {
      console.error("Error deleting all categories:", error);
      toast.error("Error deleting all categories");
    } finally {
      setIsDeleting(false);
    }
  };

  // Selection handlers
  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(currentCategories.map((category) => category.id));
    }
    setSelectAll(!selectAll);
  };

  const handleDeleteSelected = () => {
    if (selectedCategories.length === 0) {
      toast.error("Please select categories to delete");
      return;
    }
    setDeleteSelectedModal(true);
  };

  const confirmDeleteSelected = async () => {
    if (selectedCategories.length === 0) return;

    setIsDeleting(true);
    try {
      const response = await fetch("/api/admin/categories/bulk-delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ categoryIds: selectedCategories }),
      });

      if (response.ok) {
        toast.success(`Successfully deleted ${selectedCategories.length} categories`);
        setSelectedCategories([]);
        setSelectAll(false);
        await fetchCategories();
        setDeleteSelectedModal(false);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to delete selected categories");
      }
    } catch (error) {
      console.error("Error deleting selected categories:", error);
      toast.error("Error deleting selected categories");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddCategory = async (categoryData: Omit<CategoryType, 'id' | 'meta'>) => {
    if (!session?.user?.email) return;

    setLoading(true);
    try {
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoryData),
      });
      if (response.ok) {
        setShowCreateModal(false);
        fetchCategories();
        toast.success("Category added successfully!");
      } else {
        toast.error("Failed to add category");
      }
    } catch (error) {
      console.error("Error adding category:", error);
      toast.error("Error adding category");
    } finally {
      setLoading(false);
    }
  };

  const handleEditCategory = async (categoryData: Omit<CategoryType, 'id' | 'meta'>) => {
    if (!session?.user?.email) return;

    setLoading(true);
    if (!editingCategory) return;

    try {
      const response = await fetch(`/api/admin/categories/${editingCategory.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoryData),
      });
      if (response.ok) {
        setEditingCategory(null);
        fetchCategories();
        toast.success("Category updated successfully!");
      } else {
        toast.error("Failed to update category");
      }
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error("Error updating category");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Categories Management</h2>
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
            Categories Management ({filteredCategories.length})
          </h2>
          <div className="grid grid-cols-2 items-center sm:flex sm:grid-cols-none gap-2">
            {hasPermission(userRole as any, "canDeleteProducts") && (
              <>
                <button
                  onClick={handleDeleteSelected}
                  className="flex items-center px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                  disabled={selectedCategories.length === 0}
                >
                  Delete Selected ({selectedCategories.length})
                </button>
                <button
                  onClick={() => setDeleteAllModal(true)}
                  className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                  disabled={categories.length === 0}
                >
                  Delete All
                </button>
              </>
            )}
            <button
              onClick={fetchCategories}
              className="flex items-center px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
            >
              Refresh
            </button>
            {hasPermission(userRole as any, "canCreateProducts") && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center px-3 py-2 bg-theme-color text-white rounded-lg hover:bg-theme-color/80 transition-colors text-sm"
              >
                Add New Category
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-color focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Categories Table */}
      <div className="overflow-x-auto">
        <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                <input
                  type="checkbox"
                  checked={selectAll && currentCategories.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                Category
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                Products
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                Description
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentCategories.map((category) => (
              <tr key={category.id} className="hover:bg-gray-50">
                <td className="px-3 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category.id)}
                    onChange={() => handleSelectCategory(category.id)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-12 w-12">
                      {category.image ? (
                        <img
                          className="h-12 w-12 rounded-lg object-cover"
                          src={category.image}
                          alt={category.name}
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
                          category.image ? 'hidden' : 'flex'
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
                        {category.name}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    {category.productCount}
                  </span>
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="max-w-xs truncate">
                    {category.description}
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setViewCategoryModal(category)}
                      className="p-1 text-blue-600 hover:text-blue-900 transition-colors"
                      title="View"
                    >
                      <FiEye className="h-4 w-4" />
                    </button>
                    {hasPermission(userRole as any, "canUpdateProducts") && (
                      <button
                        onClick={() => setEditingCategory(category)}
                        className="p-1 text-indigo-600 hover:text-indigo-900 transition-colors"
                        title="Edit"
                      >
                        <FiEdit2 className="h-4 w-4" />
                      </button>
                    )}
                    {hasPermission(userRole as any, "canDeleteProducts") && (
                      <button
                        onClick={() => handleDeleteCategory(category)}
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
      {filteredCategories.length === 0 && !loading && (
        <div className="px-6 py-12 text-center">
          <FiSearch className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No categories found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm
              ? "Try adjusting your search criteria."
              : "Get started by adding your first category."}
          </p>
        </div>
      )}

      {/* Pagination */}
      {filteredCategories.length > categoriesPerPage && (
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {indexOfFirstCategory + 1} to{" "}
              {Math.min(indexOfLastCategory, filteredCategories.length)} of{" "}
              {filteredCategories.length} results
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

      {/* Add Category Sidebar */}
      <Sidebar
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New Category"
        width="w-96"
      >
        <CategoryForm
          onSubmit={handleAddCategory}
          onCancel={() => setShowCreateModal(false)}
          loading={loading}
        />
      </Sidebar>

      {/* Edit Category Sidebar */}
      <Sidebar
        isOpen={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        title="Edit Category"
        width="w-96"
      >
        {editingCategory && (
          <CategoryForm
            category={editingCategory}
            onSubmit={handleEditCategory}
            onCancel={() => setEditingCategory(null)}
            loading={loading}
            isEdit={true}
          />
        )}
      </Sidebar>

      {/* View Category Modal */}
      {viewCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-11/12 overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Category Details
                </h3>
                <button
                  onClick={() => setViewCategoryModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX size={24} />
                </button>
              </div>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="flex flex-wrap gap-3">
                <div className="text-center">
                  <div className="flex-shrink-0 h-64 w-92 mx-auto">
                    {viewCategoryModal.image ? (
                      <img
                        className="h-64 w-92 rounded-lg object-cover"
                        src={viewCategoryModal.image}
                        alt={viewCategoryModal.name}
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
                        viewCategoryModal.image ? 'hidden' : 'flex'
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
                  <h4 className="text-xl font-semibold text-gray-900 mt-4">{viewCategoryModal.name}</h4>
                  <p className="text-gray-600">/{viewCategoryModal.slug}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Category Information</h4>
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-900">{viewCategoryModal.description}</p>
                  </div>
                  <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Category ID
                      </dt>
                      <dd className="text-sm text-gray-900">
                        #{viewCategoryModal.id.slice(-8)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Slug
                      </dt>
                      <dd className="text-sm text-gray-900">
                        {viewCategoryModal.slug}
                      </dd>
                    </div>
                    {viewCategoryModal.meta && (
                      <>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">
                            Created At
                          </dt>
                          <dd className="text-sm text-gray-900">
                            {new Date(viewCategoryModal.meta.createdAt).toLocaleString()}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">
                            Updated At
                          </dt>
                          <dd className="text-sm text-gray-900">
                            {new Date(viewCategoryModal.meta.updatedAt).toLocaleString()}
                          </dd>
                        </div>
                      </>
                    )}
                  </dl>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex justify-end">
                <button
                  onClick={() => setViewCategoryModal(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Category Modal */}
      {deleteCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="px-6 py-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <FiTrash2 className="mr-2 h-5 w-5 text-red-600" />
                Delete Category
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Are you sure you want to delete category{" "}
                <strong>
                  #{deleteCategoryModal.id.slice(-8)}
                </strong>
                ?
              </p>
              <div className="mt-3 bg-gray-50 rounded-lg p-3">
                <div className="text-sm text-gray-700">
                  <div>
                    <strong>Name:</strong> {deleteCategoryModal.name}
                  </div>
                  <div>
                    <strong>Slug:</strong> {deleteCategoryModal.slug}
                  </div>
                  <div>
                    <strong>Description:</strong> {deleteCategoryModal.description}
                  </div>
                </div>
              </div>
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">
                  <strong>Warning:</strong> This action cannot be undone. The
                  category will be permanently removed from the database.
                </p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setDeleteCategoryModal(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteCategory}
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
                    Delete Category
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Categories Modal */}
      {deleteAllModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="px-6 py-4">
              <h3 className="text-lg font-medium text-gray-900">
                Delete All Categories
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Are you sure you want to delete ALL categories? This action will
                remove all categories from the categories collection. This action cannot be undone.
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
                onClick={handleDeleteAllCategories}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete All"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Selected Categories Modal */}
      {deleteSelectedModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="px-6 py-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <FiTrash2 className="mr-2 h-5 w-5 text-red-600" />
                Delete Selected Categories
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Are you sure you want to delete{" "}
                <strong>{selectedCategories.length}</strong> selected categories? This
                action will permanently remove these categories from the database
                and cannot be undone.
              </p>
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Warning:</strong> This will delete the categories from
                  the categories collection in the database.
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
                    Delete {selectedCategories.length} Categories
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
