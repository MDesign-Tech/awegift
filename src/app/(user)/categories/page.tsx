export const dynamic = "force-dynamic";
import Container from "@/components/Container";
import InfiniteCategoryGrid from "@/components/pages/categories/InfiniteCategoryGrid";
import { getData } from "../helpers";
import { generateSEO } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";
import { CategoryType } from "../../../../type";
import JsonLd from "@/components/JsonLd";
import { SITE_URL } from "@/lib/seo";

type CategoryWithCount = CategoryType & { productCount: number };
type EnrichedCategory = CategoryWithCount & { count: number };

export const metadata: Metadata = generateSEO({
  title: "Product Categories | AweGift",
  description:
    "Browse AweGift product categories, including personalized products, printing, branding, packaging and corporate supplies in Rwanda.",
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

  // Map to Category interface expected by InfiniteCategoryGrid
  const enrichedCategories =
    categoriesData?.map((category) => ({
      slug: category.slug,
      name: category.name,
      url: category.image || "",
      description: category.description || "",
      count: category.productCount || 0,
    })) || [];
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: "Product Categories | AweGift",
        url: `${SITE_URL}/categories`,
        description:
          "Browse AweGift product categories, including personalized products, printing, branding, packaging and corporate supplies in Rwanda.",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
          {
            "@type": "ListItem",
            position: 2,
            name: "Categories",
            item: `${SITE_URL}/categories`,
          },
        ],
      },
    ],
  };

  return (
    <Container className="py-4 md:py-8">
      <JsonLd data={structuredData} />
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
