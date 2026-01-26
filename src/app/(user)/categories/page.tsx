export const dynamic = "force-dynamic";
import Container from "@/components/Container";
import InfiniteCategoryGrid from "@/components/pages/categories/InfiniteCategoryGrid";
import { getData } from "../helpers";
import { getCategoriesWithCounts } from "../helpers/productHelpers";
import { generateSEO } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";
import { CategoryType } from "../../../../type";

type CategoryWithCount = CategoryType & { productCount: number };
type EnrichedCategory = CategoryWithCount & { count: number };

export const metadata: Metadata = generateSEO({
  title: "Gift Categories | AweGift - Shop by Category",
  description:
    "Explore our wide range of gift categories including personalized gifts, luxury items, custom presents, and more. Find the perfect gift with our organized collections.",
  keywords: [
    "gift categories",
    "personalized gifts",
    "luxury gifts",
    "custom presents",
    "birthday gifts",
    "anniversary gifts",
    "wedding gifts",
    "shop by category",
  ],
  url: "/categories",
});

export default async function CategoriesPage() {
  // Fetch categories with product counts from API
  const categoriesData = await getData(`/api/categories`) as CategoryWithCount[];

  console.log("Categories Data:", categoriesData);

  // Map to Category interface expected by InfiniteCategoryGrid
  const enrichedCategories =
    categoriesData?.map((category) => ({
      slug: category.slug,
      name: category.name,
      url: category.image || "",
      description: category.description || "",
      count: category.productCount || 0,
    })) || [];

  return (
    <Container className="py-4 md:py-8">
      {/* Page Header */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Categories
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            Discover our wide range of product categories.
          </p>
        </div>

        {/* Breadcrumb */}
        <nav className="text-xs sm:text-sm">
          <ol className="flex items-center space-x-2 text-gray-500">
            <li>
              <Link href="/" className="hover:text-gray-700 transition-colors">
                Home
              </Link>
            </li>
            <li>/</li>
            <li className="text-gray-900 font-medium">Categories</li>
          </ol>
        </nav>
      </div>

      {/* Categories Grid */}
      <InfiniteCategoryGrid
        initialCategories={enrichedCategories}
        totalProducts={enrichedCategories.reduce((sum: number, cat) => sum + cat.count, 0)}
        allProducts={[]}
      />
    </Container>
  );
}
