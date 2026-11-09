"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import CategoriesSkeleton from "@/components/skeletons/CategoriesSkeleton";
import type { CategoryType } from "../../../../type";

const DynamicFeaturedCategories: React.FC = () => {
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/categories/featured");
        if (response.ok) {
          const featuredCategories = await response.json();
          setCategories(featuredCategories);
        }
      } catch (error) {
        console.error("Error fetching featured categories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return <CategoriesSkeleton />;
  }

  if (categories.length === 0) {
    return (
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Shop by Category
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover our diverse range of products across various categories
            </p>
          </div>
          <div className="text-center py-10">
            <p className="text-gray-500 text-lg">
              No categories available at the moment.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-gradient-to-b from-gray-50 to-white py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center md:mb-12">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
            Shop by Category
          </h2>
          <p className="mx-auto max-w-2xl text-gray-600">
            Discover our diverse range of products across various categories
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {categories.map((category) => (
            <Link
              key={category.id || category.slug}
              href={`/products?category=${encodeURIComponent(category.slug)}`}
              className="group overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-theme-color"
            >
              <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                {category.image ? (
                  <img
                    src={category.image}
                    alt={category.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-gray-400">
                    AweGift
                  </div>
                )}
              </div>
              <div className="p-3 sm:p-4">
                <h3 className="font-semibold text-gray-900 group-hover:text-theme-color">
                  {category.name}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {category.productCount} products
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DynamicFeaturedCategories;
