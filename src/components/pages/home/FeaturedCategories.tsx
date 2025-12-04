import React from "react";
import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import type { CategoryType } from "../../../../type";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop";

async function fetchCategories(): Promise<CategoryType[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
    const res = await fetch(`${baseUrl}/api/categories`, {
      // Add cache control if needed
      next: { revalidate: 3600 }, // Revalidate every hour
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch categories: ${res.status}`);
    }

    const data = await res.json();
    const sourceCategories: any[] = Array.isArray(data) ? data : data?.categories || [];

    // Normalize to CategoryType
    const normalized: CategoryType[] = sourceCategories.map((cat: any) => {
      const slug = (cat.slug || String(cat.name || "")).toLowerCase();
      const id = cat.id || slug;
      const name = cat.name || slug;
      const description = cat.description || `Discover amazing ${name} products`;
      const image = cat.image || cat.url || DEFAULT_IMAGE;

      const mapped: CategoryType = {
        id,
        name,
        slug,
        description,
        image,
        meta: cat.meta || undefined,
      };

      // Attach productCount for UI
      (mapped as any).productCount = cat.productCount || 0;

      return mapped;
    });

    return normalized;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

const FeaturedCategories: React.FC = async () => {
  const categories = await fetchCategories();

  // Take first 4 categories for featured section
  const featuredCategories = categories.slice(0, 4);

  if (featuredCategories.length === 0) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Shop by Category
          </h2>
          <p className="text-lg text-gray-600">
            Unable to load categories at the moment. Please try again later.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Shop by Category
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover our curated collections across different categories
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {featuredCategories.map((category) => (
            <Link
              key={category.slug}
              href={`/products?category=${category.slug}`}
            >
              <div className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute top-3 left-3 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {(category as any).productCount || 0} items
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    {category.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-600 font-medium text-sm">
                      Shop Now
                    </span>
                    <FiArrowRight className="w-4 h-4 text-blue-600 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/categories"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
          >
            View All Categories
            <FiArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedCategories;
