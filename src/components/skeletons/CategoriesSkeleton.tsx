"use client";

import React from "react";
import Container from "@/components/Container";

const CategoriesSkeleton = () => {
  return (
    <section className="bg-gradient-to-b from-gray-50 to-white">
      <Container className="container mx-auto py-4 sm:py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Shop by Category
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover our diverse range of products across various categories
          </p>
        </div>

        {/* Skeleton Carousel */}
        <div className="relative mx-4 md:mx-0">
          <div className="overflow-hidden">
            <div className="flex justify-center gap-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="flex-shrink-0 w-32">
                  <div className="group">
                    {/* Image Container Skeleton */}
                    <div className="relative mb-3 border border-gray-200 rounded-lg aspect-square bg-gradient-to-br from-gray-200 to-gray-300 shadow-md animate-pulse">

                      {/* Skeleton image placeholder */}
                      <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded-lg">
                      </div>
                    </div>

                    {/* Category Info Skeleton */}
                    <div className="text-center space-y-1 px-2">
                      <div className="h-3 bg-gray-300 rounded animate-pulse mx-auto w-16"></div>                     
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* View All Categories Link Skeleton */}
        <div className="text-center mt-8">
          <div className="inline-flex items-center px-6 py-3 bg-gray-300 text-gray-300 rounded-full animate-pulse">
            View All Categories
            <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default CategoriesSkeleton;