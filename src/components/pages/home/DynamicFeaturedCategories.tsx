"use client";

import React, { useState, useEffect } from "react";
import CategoriesCarousel from "./CategoriesCarousel";
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

  return <CategoriesCarousel categories={categories} />;
};

export default DynamicFeaturedCategories;
