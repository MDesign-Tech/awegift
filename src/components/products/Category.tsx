"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { FaChevronDown } from "react-icons/fa";
import { ProductType } from "../../../type";

interface CategoryProps {
  categories?: Array<{
    id: string;
    name: string;
    slug: string;
    productCount?: number;
  }>;
  allProducts?: ProductType[];
}

const Category = ({ categories = [], allProducts = [] }: CategoryProps) => {
  const [isOpen, setIsOpen] = useState(true); // Open by default
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategories = searchParams.getAll("category");

  // Helper function to get exact product count for a category
  const getProductCountForCategory = (categoryName: string): number => {
    if (!allProducts || allProducts.length === 0) return 0;
    return allProducts.filter(
      (product: ProductType) =>
        product.categories &&
        product.categories.some(
          (cat: string) => cat.toLowerCase() === categoryName.toLowerCase()
        )
    ).length;
  };

  const handleCategoryClick = (categorySlug: string) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    const currentCats = current.getAll("category");

    if (currentCats.includes(categorySlug)) {
      // Remove if already selected
      current.delete("category");
      currentCats
        .filter((cat) => cat !== categorySlug)
        .forEach((cat) => current.append("category", cat));
    } else {
      // Add if not selected
      current.append("category", categorySlug);
    }

    const search = current.toString();
    const query = search ? `?${search}` : "";
    router.push(`/products${query}`);
  };

  return (
    <div className="w-full">
      {/* Accordion Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 px-0 text-left focus:outline-none group"
      >
        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-theme-color transition-colors">
          Category
        </h3>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
          <FaChevronDown />
        </motion.div>
      </button>

      {/* Accordion Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-2 pb-4">
              <div className="space-y-2">
                {/* All Option */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="category-all"
                    name="category"
                    checked={currentCategories.length === 0}
                    onChange={() => {
                      const current = new URLSearchParams(
                        Array.from(searchParams.entries())
                      );
                      current.delete("category");
                      router.push(`/products?${current.toString()}`);
                    }}
                    className="w-4 h-4 text-theme-color bg-gray-100 border-gray-300 focus:ring-theme-color focus:ring-2 accent-theme-color"
                  />
                  <button
                    onClick={() => {
                      const current = new URLSearchParams(
                        Array.from(searchParams.entries())
                      );
                      current.delete("category");
                      router.push(`/products?${current.toString()}`);
                    }}
                    className="ml-2 text-sm font-medium text-gray-900 hover:text-theme-color transition-colors flex-1 text-left"
                  >
                    All ({allProducts.length})
                  </button>
                </div>

                {/* Regular Categories */}
                {categories.map((category, index) => {
                  const isActive = currentCategories.includes(category.slug);
                  const count = getProductCountForCategory(category.name);
                  return (
                    <div key={index} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`category-${category.slug}`}
                        name="category"
                        checked={isActive}
                        onChange={() => handleCategoryClick(category.slug)}
                        className="w-4 h-4 text-theme-color bg-gray-100 border-gray-300 focus:ring-theme-color focus:ring-2 accent-theme-color"
                      />
                      <button
                        onClick={() => handleCategoryClick(category.slug)}
                        className="ml-2 text-sm font-medium text-gray-900 hover:text-theme-color transition-colors flex-1 text-left"
                      >
                        {category.name} ({count})
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Category;
