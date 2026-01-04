"use client";

import React, { useState, useEffect, useRef } from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import Link from "next/link";
import Container from "@/components/Container";

import type { CategoryType } from "../../../../type";

const ImageFallback = () => (
  <svg
    className="h-20 w-20 text-gray-400"
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

interface CategoriesCarouselProps {
  categories: CategoryType[];
}

const CategoriesCarousel: React.FC<CategoriesCarouselProps> = ({
  categories,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Responsive items per view
  const getItemsPerView = () => {
    if (typeof window !== "undefined") {
      if (window.innerWidth >= 1280) return 6; // xl
      if (window.innerWidth >= 1024) return 5; // lg
      if (window.innerWidth >= 768) return 4; // md
      if (window.innerWidth >= 640) return 3; // sm
      return 3; // xs
    }
    return 2;
  };

  const [itemsPerView, setItemsPerView] = useState(getItemsPerView);

  useEffect(() => {
    const handleResize = () => {
      const newItemsPerView = getItemsPerView();
      setItemsPerView(newItemsPerView);

      // Reset currentIndex if it goes out of bounds after resize
      const newMaxIndex = Math.max(0, categories.length - newItemsPerView);
      setCurrentIndex((prev) => Math.min(prev, newMaxIndex));
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [categories.length]);

  const maxIndex = Math.max(0, categories.length - itemsPerView);
  const needsScrolling = categories.length > itemsPerView;

  const goToPrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  // Touch/Mouse drag handlers
  const handleStart = (clientX: number) => {
    setIsDragging(true);
    setStartX(clientX);
    setScrollLeft(currentIndex);
  };

  const handleMove = (clientX: number) => {
    if (!isDragging) return;

    const x = clientX;
    const walk = (startX - x) / 100;
    const newIndex = Math.round(scrollLeft + walk);

    // Constrain the index to valid boundaries
    const constrainedIndex = Math.max(0, Math.min(maxIndex, newIndex));
    setCurrentIndex(constrainedIndex);
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  if (!categories.length) {
    return null;
  }

  return (
    <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
      <Container className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Shop by Category
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover our diverse range of products across various categories
          </p>
        </div>

        {/* Carousel Container */}
        {categories.length > 0 ? (
          needsScrolling ? (
            <div className="relative mx-auto max-w-full">
              {/* Navigation Buttons */}
              {needsScrolling && (
                <>
                  <button
                    onClick={goToPrevious}
                    disabled={currentIndex === 0}
                    className={`absolute left-0 top-[30%] -translate-y-1/2 z-10 border border-gray-200 rounded-full p-2 md:p-3 transition-all duration-300 group -ml-4 ${
                      currentIndex === 0
                        ? "bg-gray-100 cursor-not-allowed opacity-50"
                        : "bg-white shadow-lg hover:shadow-xl hover:bg-gray-50 cursor-pointer"
                    }`}
                    aria-label="Previous categories"
                  >
                    <FaArrowLeft
                      className={`transition-colors duration-300 ${
                        currentIndex === 0
                          ? "text-gray-400"
                          : "text-gray-600 group-hover:text-gray-800"
                      }`}
                    />
                  </button>

                  <button
                    onClick={goToNext}
                    disabled={currentIndex === maxIndex}
                    className={`absolute right-0 top-[30%] -translate-y-1/2 z-10 border border-gray-200 rounded-full p-2 md:p-3 transition-all duration-300 group -mr-4 ${
                      currentIndex === maxIndex
                        ? "bg-gray-100 cursor-not-allowed opacity-50"
                        : "bg-white shadow-lg hover:shadow-xl hover:bg-gray-50 cursor-pointer"
                    }`}
                    aria-label="Next categories"
                  >
                    <FaArrowRight
                      className={`transition-colors duration-300 ${
                        currentIndex === maxIndex
                          ? "text-gray-400"
                          : "text-gray-600 group-hover:text-gray-800"
                      }`}
                    />
                  </button>
                </>
              )}

              {/* Carousel */}
              <div
                ref={carouselRef}
                className="overflow-hidden cursor-grab active:cursor-grabbing"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseLeave={handleEnd}
              >
                <div
                  className="flex justify-center transition-transform duration-500 ease-in-out"
                  style={{
                    transform: `translateX(-${
                      (currentIndex / categories.length) * 100
                    }%)`,
                    width: `${(categories.length / itemsPerView) * 100}%`,
                  }}
                >
                  {categories.map((category) => (
                    <div
                      key={category.slug}
                      className="flex-shrink-0 px-2"
                      style={{ width: `${100 / categories.length}%` }}
                    >
                      <Link href={`/products?category=${category.slug}`}>
                        <div className="group cursor-pointer">
                          {/* Image Container with Rectangle Border */}
                          <div className="relative mb-3 border border-gray-200 rounded-lg aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
                            {/* Multiple layered shadows for depth */}
                            <div className="absolute inset-0 shadow-inner"></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/20"></div>

                            <div className="overflow-hidden w-full h-full">
                              {(category as any).image || category.image ? (
                                <img
                                  src={
                                    (category as any).image || category.image
                                  }
                                  alt={category.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                  <ImageFallback />
                                </div>
                              )}
                            </div>

                            {/* Overlay for better text readability */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                            {/* Item count badge */}
                            <div className="absolute top-2 right-2 bg-theme-color text-white text-xs px-2 py-1 rounded-full shadow-md">
                              {(category as any).productCount ||
                                (category as any).itemCount ||
                                (category as any).count ||
                                0}
                            </div>
                          </div>

                          {/* Category Info */}
                          <div className="text-center space-y-1 px-2">
                            <h3 className="font-semibold text-gray-900 group-hover:text-theme-color transition-colors duration-300 text-sm">
                              {category.name}
                            </h3>
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dots Indicator */}
              {needsScrolling && maxIndex > 0 && (
                <div className="flex justify-center mt-8 space-x-2">
                  {Array.from({ length: maxIndex + 1 }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setCurrentIndex(index);
                      }}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentIndex
                          ? "bg-theme-color w-8"
                          : "bg-gray-300 hover:bg-gray-400"
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex justify-center flex-wrap gap-6">
              {categories.map((category) => (
                <div key={category.slug} className="w-40 md:w-48 px-2">
                  <Link href={`/products?category=${category.slug}`}>
                    <div className="group cursor-pointer">
                      <div className="relative mb-3 border border-gray-200 rounded-lg aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
                        <div className="absolute inset-0 shadow-inner"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/20"></div>
                        <div className="overflow-hidden w-full h-full">
                          {(category as any).image || category.image ? (
                            <img
                              src={(category as any).image || category.image}
                              alt={category.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                              <ImageFallback />
                            </div>
                          )}
                        </div>
                        <div className="absolute top-2 right-2 bg-theme-color text-white text-xs px-2 py-1 rounded-full shadow-md">
                          {(category as any).productCount ||
                            (category as any).itemCount ||
                            (category as any).count ||
                            0}
                        </div>
                      </div>
                      <div className="text-center space-y-1 px-2">
                        <h3 className="font-semibold text-gray-900 group-hover:text-theme-color transition-colors duration-300 text-sm">
                          {category.name}
                        </h3>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-500 text-lg">
              No categories available at the moment.
            </p>
          </div>
        )}
        {/* View All Categories Link */}
        <div className="text-center mt-8">
          <Link
            href="/categories"
            className="inline-flex items-center px-4 py-2 md:px-6 md:py-3 bg-theme-color text-white rounded-full hover:bg-accent-color transition-colors duration-300 shadow-md hover:shadow-lg"
          >
            View All Categories
            <FaArrowRight className="ml-2" />
          </Link>
        </div>
      </Container>
    </section>
  );
};

export default CategoriesCarousel;
