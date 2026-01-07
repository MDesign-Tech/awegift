"use client";

import { useState, useEffect } from "react";
import ProductSection from "./ProductSection";
import ProductSectionSkeleton from "@/components/skeletons/ProductSectionSkeleton";
import { ProductType } from "../../../../type";

const Products = () => {
  const [products, setProducts] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/products/featured?limit=0");
        if (response.ok) {
          const data = await response.json();
          const featuredProducts = data?.products || [];
          setProducts(featuredProducts);
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
        title="Products"
        subtitle="Our most popular products loved by customers"
      />
    );
  }

  return (
    <ProductSection
      title="Products"
      subtitle="Our most popular products loved by customers"
      products={products}
      viewMoreLink="/products"
    />
  );
};

export default Products;