"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { FiLoader, FiEye, FiEdit2, FiTrash2 } from "react-icons/fi";

interface CategoryWithId {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  productCount?: number;
  meta?: {
    createdAt: string;
    updatedAt: string;
  };
}

interface InfiniteCategoryListProps {
  categories: CategoryWithId[];
  onView: (category: CategoryWithId) => void;
  onEdit: (category: CategoryWithId) => void;
  onDelete: (category: CategoryWithId) => void;
  isRefreshing: boolean;
  itemsPerPage?: number;
}

const InfiniteCategoryList = ({
  categories,
  onView,
  onEdit,
  onDelete,
  isRefreshing,
  itemsPerPage = 20,
}: InfiniteCategoryListProps) => {
  const [displayedCategories, setDisplayedCategories] = useState<CategoryWithId[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);

  // Reset when categories change
  useEffect(() => {
    setCurrentPage(1);
    setDisplayedCategories(categories.slice(0, itemsPerPage));
    setHasMore(categories.length > itemsPerPage);
  }, [categories, itemsPerPage]);

  // Load more categories
  const loadMore = useCallback(() => {
    if (isLoading || !hasMore || isRefreshing) return;

    setIsLoading(true);
    setTimeout(() => {
      const nextPage = currentPage + 1;
      const startIndex = (nextPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const newCategories = categories.slice(startIndex, endIndex);

      if (newCategories.length > 0) {
        setDisplayedCategories((prev) => [...prev, ...newCategories]);
        setCurrentPage(nextPage);
        setHasMore(endIndex < categories.length);
      } else {
        setHasMore(false);
      }
      setIsLoading(false);
    }, 500);
  }, [currentPage, categories, itemsPerPage, isLoading, hasMore, isRefreshing]);

  // Intersection Observer for infinite scroll
  const lastCategoryElementRef = useCallback(
    (node: HTMLTableRowElement) => {
      if (isLoading || isRefreshing) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      });
      if (node) observer.current.observe(node);
    },
    [isLoading, hasMore, loadMore, isRefreshing]
  );

  return (
    <>
      {/* Categories Table Body */}
      <tbody className="bg-white divide-y divide-gray-200">
        {displayedCategories.map((category, index) => (
          <tr
            key={category.id}
            ref={
              index === displayedCategories.length - 1 ? lastCategoryElementRef : null
            }
            className="hover:bg-gray-50"
          >
            <td className="px-3 py-4 whitespace-nowrap">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                disabled={isRefreshing}
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
                {category.productCount || 0}
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
                  onClick={() => onView(category)}
                  className="p-1 text-blue-600 hover:text-blue-900 transition-colors disabled:opacity-50"
                  title="View"
                  disabled={isRefreshing}
                >
                  <FiEye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onEdit(category)}
                  className="p-1 text-indigo-600 hover:text-indigo-900 transition-colors disabled:opacity-50"
                  title="Edit"
                  disabled={isRefreshing}
                >
                  <FiEdit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDelete(category)}
                  className="p-1 text-red-600 hover:text-red-900 transition-colors disabled:opacity-50"
                  title="Delete"
                  disabled={isRefreshing}
                >
                  <FiTrash2 className="h-4 w-4" />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>

      {/* Loading indicator */}
      {isLoading && (
        <tbody>
          <tr>
            <td colSpan={5} className="px-6 py-8 text-center">
              <FiLoader className="animate-spin text-theme-color mx-auto h-6 w-6" />
              <span className="ml-2 text-gray-600">Loading more categories...</span>
            </td>
          </tr>
        </tbody>
      )}

      {/* No more categories message */}
      {!hasMore && categories.length > itemsPerPage && (
        <tbody>
          <tr>
            <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
              You've reached the end of the categories list.
            </td>
          </tr>
        </tbody>
      )}
    </>
  );
};

export default InfiniteCategoryList;