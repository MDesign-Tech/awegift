"use client";

import React from "react";
import Container from "@/components/Container";

interface ProductSectionSkeletonProps {
  title: string;
  subtitle?: string;
}

const ProductSectionSkeleton: React.FC<ProductSectionSkeletonProps> = ({
  title,
  subtitle,
}) => {
  return (
    <Container className="py-4 sm:py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            {title}
          </h2>
          {subtitle && (
            <p className="text-gray-600 text-sm md:text-base">{subtitle}</p>
          )}
        </div>
        <div className="px-4 py-2 border border-gray-300 rounded-md bg-gray-100 animate-pulse w-24 h-10"></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
            {/* Product Image Skeleton */}
            <div className="aspect-square bg-gray-200 relative">
              <div className="absolute top-2 right-2 w-8 h-8 bg-gray-300 rounded-full"></div>
            </div>

            {/* Product Info Skeleton */}
            <div className="p-4 space-y-3">
              {/* Title */}
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>

              {/* Brand */}
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>

              {/* Rating */}
              <div className="flex items-center space-x-1">
                <div className="flex space-x-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="w-3 h-3 bg-gray-200 rounded"></div>
                  ))}
                </div>
                <div className="h-3 bg-gray-200 rounded w-8"></div>
              </div>

              {/* Price */}
              <div className="flex items-center space-x-2">
                <div className="h-5 bg-gray-200 rounded w-16"></div>
                <div className="h-4 bg-gray-200 rounded w-12"></div>
              </div>

              {/* Stock Status */}
              <div className="h-6 bg-gray-200 rounded w-20"></div>

              {/* Add to Cart Button */}
              <div className="h-10 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
};

export default ProductSectionSkeleton;