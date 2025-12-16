"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { FiArrowRight, FiPackage } from "react-icons/fi";
import { getData } from "../../../app/(user)/helpers";

import type { CategoryType } from "../../../../type";

interface Category {
  slug: string;
  name: string;
  url: string;
  description: string;
  count?: number;
}

interface InfiniteCategoryGridProps {
  // optional seed categories (kept for compatibility) — the component will fetch from /api/categories
  initialCategories?: Category[];
  totalProducts?: number;
  allProducts?: any[];
}

// Category skeleton component
const CategorySkeleton = () => (
  <div className="bg-white rounded-xl shadow-lg overflow-hidden h-full animate-pulse">
    <div className="h-32 lg:h-40 bg-gray-200"></div>
    <div className="p-3 lg:p-4">
      <div className="h-4 lg:h-5 bg-gray-200 rounded mb-2"></div>
      <div className="h-3 bg-gray-200 rounded mb-1"></div>
      <div className="h-3 bg-gray-200 rounded w-3/4 mb-3"></div>
      <div className="flex items-center justify-between">
        <div className="h-3 bg-gray-200 rounded w-20"></div>
        <div className="h-3 w-3 bg-gray-200 rounded"></div>
      </div>
    </div>
  </div>
);



const CategoryCard: React.FC<{ category: Category; index: number }> = ({
  category,
  index,
}) => {
  const categoryName = category.name
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
  const categorySlug = category.slug;
  const description = category.description || "Discover amazing products in this category";
  const productCount = category.count || 0;
  const isDisabled = productCount === 0;

  const cardContent = (
    <div
      className={`relative bg-white rounded-2xl shadow-md overflow-hidden h-full border transition-all duration-500 ${
        isDisabled
          ? "border-gray-200 opacity-60 cursor-not-allowed"
          : "group border-gray-100 hover:border-accent-color hover:shadow-2xl transform hover:-translate-y-3 hover:scale-[1.02]"
      }`}
    >
      {/* Image Container */}
      <div className="relative h-36 lg:h-44 overflow-hidden">
        {category.url ? (
          <img
            src={category.url}
            alt={categoryName}
            className={`w-full h-full object-cover transition-transform duration-700 ${
              isDisabled
                ? "filter grayscale"
                : "group-hover:scale-110 filter group-hover:brightness-110"
            }`}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <svg
              className="h-12 w-12 text-gray-400"
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
        )}

        {/* Multi-layered Overlay - Only for enabled categories */}
        {!isDisabled && (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute inset-0 bg-gradient-to-br from-theme-color/10 to-accent-color/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </>
        )}

        {/* Product Count Badge */}
        <div
          className={`absolute top-3 left-3 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg transition-transform duration-300 ${
            isDisabled
              ? "bg-gray-500"
              : "bg-gradient-to-r from-theme-color to-accent-color transform group-hover:scale-110"
          }`}
        >
          {productCount} items
        </div>

        {/* Category Icon with Enhanced Animation - Only for enabled categories */}
        {!isDisabled && (
          <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-4 translate-y-[-4px] group-hover:translate-x-0 group-hover:translate-y-0 group-hover:rotate-12">
            <FiPackage className="w-4 h-4 text-theme-color" />
          </div>
        )}

        {/* Disabled Overlay */}
        {isDisabled && (
          <div className="absolute inset-0 bg-gray-900/30 flex items-center justify-center">
            <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2">
              <span className="text-gray-700 text-sm font-medium">
                Out of Stock
              </span>
            </div>
          </div>
        )}

        {/* Shimmer Effect - Only for enabled categories */}
        {!isDisabled && (
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </div>
        )}
      </div>

      {/* Content with Enhanced Typography */}
      <div className="p-4 lg:p-5 relative">
        <div className="flex items-center justify-between">
          <h3
            className={`text-base lg:text-lg font-bold transition-colors duration-300 line-clamp-1 ${
              isDisabled
                ? "text-gray-500"
                : "text-gray-900 group-hover:text-theme-color group-hover:tracking-wide"
            }`}
          >
            {categoryName}
          </h3>
          <div
            className={`flex items-center transition-all duration-300 ${
              isDisabled
                ? "text-gray-400"
                : "text-theme-color group-hover:text-accent-color"
            }`}
          >
            <FiArrowRight className="w-4 h-4" />
          </div>
        </div>

        {/* Bottom Glow Effect - Only for enabled categories */}
        {!isDisabled && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-theme-color to-accent-color transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
        )}
      </div>

      {/* Enhanced Border Effect - Only for enabled categories */}
      {!isDisabled && (
        <div className="absolute inset-0 border-2 border-transparent group-hover:border-accent-color rounded-2xl transition-all duration-500 opacity-0 group-hover:opacity-100" />
      )}

      {/* Corner Accent - Only for enabled categories */}
      {!isDisabled && (
        <div className="absolute top-0 right-0 w-0 h-0 border-l-[30px] border-l-transparent border-t-[30px] border-t-theme-color opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
      )}
    </div>
  );

  // Conditionally wrap with Link or return the content directly
  if (isDisabled) {
    return cardContent;
  }

  return <Link href={`/products?category=${categorySlug}`}>{cardContent}</Link>;
};

const InfiniteCategoryGrid: React.FC<InfiniteCategoryGridProps> = ({
  initialCategories = [],
  totalProducts = 0,
  allProducts = [],
}) => {
  // allCategories is the full dataset (from API). categories is the paginated slice shown.
  const [allCategories, setAllCategories] = useState<Category[]>(
    initialCategories || []
  );
  const [categories, setCategories] = useState<Category[]>(
    (initialCategories || []).slice(0, 12)
  );
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState((initialCategories || []).length > 12);
  const [page, setPage] = useState(1);
  const [totalBrands, setTotalBrands] = useState(0);

  // Fetch categories from the API on mount and replace the data source
  useEffect(() => {
    let mounted = true;

    const fetchCategories = async () => {
      setLoading(true);
      try {
        const data = await getData("/api/categories");

        // Support different response shapes: array or { categories: [] }
        const list: CategoryType[] = Array.isArray(data)
          ? data
          : data?.categories || [];

        const mapped: Category[] = list.map((c) => ({
          slug: c.slug,
          name: c.name,
          url: c.image || "",
          description: c.description || "",
          count: (c as any).productCount ?? 0,
        }));

        if (!mounted) return;

        setAllCategories(mapped);
        setCategories(mapped.slice(0, 12));
        setHasMore(mapped.length > 12);
        setPage(1);
      } catch (err) {
        // keep existing initialCategories if fetch fails
        // console.warn(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchCategories();

    return () => {
      mounted = false;
    };
  }, []);

  // Calculate unique brands from allProducts
  useEffect(() => {
    if (allProducts.length > 0) {
      const uniqueBrands = [...new Set(allProducts.map((p: any) => p.brand).filter(Boolean))];
      setTotalBrands(uniqueBrands.length);
    }
  }, [allProducts]);

  const loadMoreCategories = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);

    // Simulate API delay
    setTimeout(() => {
      const nextPageStart = page * 12;
      const nextPageEnd = (page + 1) * 12;
      const nextPageCategories = allCategories.slice(
        nextPageStart,
        nextPageEnd
      );

      if (nextPageCategories.length > 0) {
        setCategories((prev) => [...prev, ...nextPageCategories]);
        setPage((prev) => prev + 1);

        if (nextPageEnd >= allCategories.length) {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }

      setLoading(false);
    }, 1000);
  }, [loading, hasMore, page, initialCategories]);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 1000
      ) {
        loadMoreCategories();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loadMoreCategories]);

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="text-center bg-light-bg rounded-xl p-6">
        <div className="flex flex-col sm:flex-row justify-center items-center gap-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-theme-color">
              {allCategories.length}
            </div>
            <div className="text-light-text">Total Categories</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-accent-color">
              {totalProducts}+
            </div>
            <div className="text-light-text">Products</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-theme-color">
              {totalBrands}+
            </div>
            <div className="text-light-text">Brands</div>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {categories.map((category, index) => (
          <CategoryCard
            key={`${category.slug}-${index}`}
            category={category}
            index={index}
          />
        ))}

        {/* Loading Skeletons */}
        {loading &&
          Array.from({ length: 12 }).map((_, index) => (
            <CategorySkeleton key={`skeleton-${index}`} />
          ))}
      </div>

      {/* Loading/End Message */}
      <div className="text-center py-8">
        {loading && (
          <div className="flex items-center justify-center gap-2">
            <div className="w-6 h-6 border-2 border-theme-color border-t-transparent rounded-full animate-spin"></div>
            <span className="text-light-text">Loading more categories...</span>
          </div>
        )}

        {!hasMore && !loading && (
          <div className="bg-gradient-to-r from-theme-color/10 to-accent-color/10 rounded-2xl p-8">
            <div className="text-2xl font-bold text-light-text mb-2">
              🎉 You&apos;ve seen it all!
            </div>
            <p className="text-light-text mb-6">
              You&apos;ve explored all our {initialCategories.length}{" "}
              categories. Ready to start shopping?
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-theme-color hover:bg-accent-color text-theme-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
            >
              Browse All Products
              <FiArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>

      {/* Call to Action - Only show if more categories available */}
      {hasMore && !loading && (
        <div className="text-center mt-12 bg-gradient-to-r from-theme-color/10 to-accent-color/10 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-light-text mb-2">
            Can&apos;t find what you&apos;re looking for?
          </h3>
          <p className="text-light-text mb-6">
            Browse all our products or use our search feature to find exactly
            what you need.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products"
              className="bg-theme-color hover:bg-accent-color text-theme-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
            >
              View All Products
            </Link>
            <Link
              href="/products?search="
              className="bg-theme-white hover:bg-light-bg text-light-text px-6 py-3 rounded-lg font-medium border border-border-color transition-colors duration-200"
            >
              Search Products
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default InfiniteCategoryGrid;
