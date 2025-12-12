"use client";

import { useState, useEffect } from "react";
import ProductSection from "./ProductSection";
import ProductSectionSkeleton from "@/components/skeletons/ProductSectionSkeleton";
import { getBestSellers } from "@/app/(user)/helpers/productHelpers";
import { ProductType } from "../../../../type";

const BestSellersSection = () => {
  const [products, setProducts] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/products?limit=0");
        if (response.ok) {
          const data = await response.json();
          const allProducts = data?.products || [];
          const bestSellers = getBestSellers(allProducts);
          setProducts(bestSellers);
        }
      } catch (error) {
        console.error("Error fetching best sellers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <ProductSectionSkeleton
        title="Best Sellers"
        subtitle="Our most popular products loved by customers"
      />
    );
  }

  return (
    <ProductSection
      title="Best Sellers"
      subtitle="Our most popular products loved by customers"
      products={products}
      viewMoreLink="/products?category=bestsellers"
    />
  );
};

export default BestSellersSection;