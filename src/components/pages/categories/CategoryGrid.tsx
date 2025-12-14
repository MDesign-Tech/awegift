import React from "react";
import Link from "next/link";
import { FiArrowRight, FiPackage } from "react-icons/fi";
import type { CategoryType } from "../../../../type";

const ImageFallback = () => (
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
);

interface CategoryGridProps {
  categories: CategoryType[];
  totalProducts?: number;
}
const CategoryCard: React.FC<{ category: CategoryType; index: number }> = ({
  category,
  index,
}) => {
  const categoryName = category.name
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
  const categorySlug = category.slug;
  const image = (category as any).image || category.image;
  const description = category.description || "Discover amazing products in this category";
  const productCount = (category as any).productCount || (category as any).count || 0;

  return (
    <Link href={`/products?category=${categorySlug}`}>
      <div className="group relative bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden h-full">
        {/* Image Container */}
        <div className="relative h-32 lg:h-40 overflow-hidden">
          {image ? (
            <img
              src={image}
              alt={categoryName}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <ImageFallback />
            </div>
          )}
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Product Count Badge */}
          <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
            {productCount} items
          </div>

          {/* Category Icon */}
          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
            <FiPackage className="w-3 h-3 lg:w-4 lg:h-4 text-gray-700" />
          </div>
        </div>

        {/* Content */}
        <div className="p-3 lg:p-4">
          <h3 className="text-sm lg:text-base font-bold text-gray-900 mb-1 lg:mb-2 group-hover:text-blue-600 transition-colors duration-200 line-clamp-1">
            {categoryName}
          </h3>
          <p className="text-gray-600 text-xs lg:text-sm mb-2 lg:mb-3 line-clamp-2">
            {description}
          </p>

          {/* Action Button */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">
              View Products
            </span>
            <div className="flex items-center text-blue-600 group-hover:text-blue-700 transition-colors duration-200">
              <FiArrowRight className="w-3 h-3 lg:w-4 lg:h-4 transform group-hover:translate-x-1 transition-transform duration-200" />
            </div>
          </div>
        </div>

        {/* Hover Border Effect */}
        <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-200 rounded-xl transition-colors duration-300" />
      </div>
    </Link>
  );
};

const CategoryGrid: React.FC<CategoryGridProps> = ({
  categories,
  totalProducts = 0,
}) => {
  // Take only first 12 categories
  const displayCategories = categories?.slice(0, 12) || [];
  const totalBrands = Math.floor(totalProducts / 20); // Estimate brands based on products

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="text-center bg-gray-50 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row justify-center items-center gap-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {displayCategories.length}
            </div>
            <div className="text-gray-600">Categories</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {totalProducts}+
            </div>
            <div className="text-gray-600">Products</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {totalBrands}+
            </div>
            <div className="text-gray-600">Brands</div>
          </div>
        </div>
      </div>

      {/* Categories Grid - 6 per row on lg devices, 12 total */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {displayCategories.map((category, index) => (
          <CategoryCard key={category.slug} category={category} index={index} />
        ))}
      </div>

      {/* Call to Action */}
      <div className="text-center mt-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Can&apos;t find what you&apos;re looking for?
        </h3>
        <p className="text-gray-600 mb-6">
          Browse all our products or use our search feature to find exactly what
          you need.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/products"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
          >
            View All Products
          </Link>
          <Link
            href="/products?search="
            className="bg-white hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-lg font-medium border border-gray-300 transition-colors duration-200"
          >
            Search Products
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CategoryGrid;
