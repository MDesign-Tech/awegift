"use client";

import React, { useState, useEffect } from "react";
import { getCategoriesWithCounts } from "@/app/(user)/helpers/productHelpers";
import CategoriesCarousel from "./CategoriesCarousel";
import CategoriesSkeleton from "@/components/skeletons/CategoriesSkeleton";
import type { CategoryType } from "../../../../type";


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

  if (loading) {
    return <CategoriesSkeleton />;
  }

  return <CategoriesCarousel categories={categories} />;
};

export default DynamicFeaturedCategories;
