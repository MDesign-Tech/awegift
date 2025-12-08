"use client";

import React, { useState, useEffect } from "react";
import { getCategoriesWithCounts } from "@/app/(user)/helpers/productHelpers";
import RoundedCategoriesCarousel from "./RoundedCategoriesCarousel";
import type { CategoryType } from "../../../../type";

const ImageFallback = () => (
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
);

const DynamicFeaturedCategories: React.FC = () => {
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch categories and all products data
        const [categoriesResponse, productsResponse] = await Promise.all([
          fetch(`/api/categories`),
          fetch(`/api/products?limit=0`),
        ]);

        if (!categoriesResponse.ok) {
          throw new Error(`Failed to fetch categories: ${categoriesResponse.statusText}`);
        }

        const categoriesData = await categoriesResponse.json();
        const productsData = productsResponse.ok ? await productsResponse.json() : {};

        // Get categories with product counts
        const categoriesWithCounts = getCategoriesWithCounts(
          productsData?.products || []
        );

        // API returns CategoryType[] directly
        const sourceCategories: any[] = Array.isArray(categoriesData)
          ? categoriesData
          : categoriesData?.data && Array.isArray(categoriesData.data)
          ? categoriesData.data
          : [];

        // Map/normalize into CategoryType[], ensuring required fields exist
        const normalized: CategoryType[] = (sourceCategories as any[])
          .slice(0, 12)
          .map((cat: any) => {
            const slug = (cat.slug || String(cat.name || "")).toLowerCase();
            const id = cat.id || slug;
            const name = cat.name || slug;
            const description = cat.description || `Discover amazing ${name} products`;
            const image = cat.image || ""; // Keep empty if no image, UI will handle fallback

            const mapped: CategoryType = {
              id,
              name,
              slug,
              description,
              image,
              meta: cat.meta || undefined,
            };

            return mapped;
          });

        // Attach runtime itemCount so UI can show counts (prefer API productCount when available)
        normalized.forEach((c, idx) => {
          const src = sourceCategories[idx] || {};
          const categoryCount =
            ((src as any).productCount ??
              categoriesWithCounts.find((x) => x.slug === c.slug)?.count) ||
            0;
          (c as any).itemCount = categoryCount;
          // Also keep productCount field if provided by API
          if ((src as any).productCount !== undefined) {
            (c as any).productCount = (src as any).productCount;
          }
        });

        setCategories(normalized);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError(err instanceof Error ? err.message : "Failed to load categories");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (error) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Shop by Category
          </h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </section>
    );
  }

  if (loading || categories.length === 0) {
    return null; // Or return a skeleton loader if you prefer
  }

  return <RoundedCategoriesCarousel categories={categories} />;
};

export default DynamicFeaturedCategories;
