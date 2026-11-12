import type { MetadataRoute } from "next";
import { adminDb } from "@/lib/firebase/admin";
import { isProductAvailable } from "@/lib/productLimits";
import { SITE_URL } from "@/lib/seo";
import type { ProductType } from "../../type";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const publicPages = [
  "/",
  "/products",
  "/categories",
  "/about",
  "/contact",
  "/services",
  "/inquiry",
  "/faqs",
  "/privacy",
  "/terms",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [productsSnapshot, categoriesSnapshot] = await Promise.all([
    adminDb.collection("products").get(),
    adminDb.collection("categories").get(),
  ]);
  const products = productsSnapshot.docs
    .map((doc) => ({ ...doc.data(), id: doc.id }) as ProductType)
    .filter((product) => product.isActive !== false);
  const activeCategoryNames = new Set<string>();

  for (const product of products) {
    if (!isProductAvailable(product)) continue;
    if (!Array.isArray(product.categories)) continue;
    for (const name of product.categories) {
      if (typeof name === "string" && name.trim()) {
        activeCategoryNames.add(name.trim().toLocaleLowerCase());
      }
    }
  }

  const categoryUrls = categoriesSnapshot.docs
    .map((doc) => doc.data())
    .filter(
      (category) =>
        typeof category.name === "string" &&
        typeof category.slug === "string" &&
        category.name.trim() &&
        category.slug.trim() &&
        activeCategoryNames.has(category.name.trim().toLocaleLowerCase())
    )
    .map((category) => {
      const query = new URLSearchParams({ category: category.slug });
      return `${SITE_URL}/products?${query.toString()}`;
    });

  const pageEntries: MetadataRoute.Sitemap = publicPages.map((path) => ({
    url: path === "/" ? SITE_URL : `${SITE_URL}${path}`,
  }));
  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${SITE_URL}/products/${encodeURIComponent(product.id)}`,
    ...(typeof product.meta?.updatedAt === "string" &&
    !Number.isNaN(Date.parse(product.meta.updatedAt))
      ? { lastModified: new Date(product.meta.updatedAt) }
      : {}),
  }));
  const categoryEntries: MetadataRoute.Sitemap = categoryUrls.map((url) => ({
    url,
  }));

  return [...pageEntries, ...categoryEntries, ...productEntries];
}
