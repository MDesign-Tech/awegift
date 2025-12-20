export const dynamic = "force-dynamic";
import Container from "@/components/Container";
import InfiniteCategoryGrid from "@/components/pages/categories/InfiniteCategoryGrid";
import { getData } from "../helpers";
import { getCategoriesWithCounts } from "../helpers/productHelpers";
import { Metadata } from "next";
import Link from "next/link";
import { CategoryType } from "../../../../type";

type CategoryWithCount = CategoryType & { productCount: number };
type EnrichedCategory = CategoryWithCount & { count: number };

export const metadata: Metadata = {
  title: "Product Categories | AweGift - Shop by Category",
  description:
    "Explore our wide range of product categories including electronics, fashion, home decor, beauty, and more. Find exactly what you're looking for with our organized collections.",
  keywords: [
    "product categories",
    "electronics",
    "fashion",
    "home decor",
    "beauty products",
    "clothing",
    "accessories",
    "shop by category",
  ],
  openGraph: {
    title: "Product Categories | AweGift",
    description:
      "Discover our wide range of product categories. Find exactly what you're looking for with our carefully curated collections.",
    url: "/categories",
    siteName: "AweGift",
    type: "website",
  },
  alternates: {
    canonical: "/categories",
  },
};

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
    <Container className="py-10">
      {/* Page Header */}
      <div className="flex justify-between mb-6">
       <div>
         <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Categories
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Discover our wide range of product categories.
        </p>
       </div>

        {/* Breadcrumb */}
        <nav className="mt-6 text-sm">
          <ol className="flex items-center justify-center space-x-2 text-gray-500">
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
