
import Banner from "@/components/pages/home/Banner";
import Products from "@/components/pages/home/Products";
import DynamicFeaturedCategories from "@/components/pages/home/DynamicFeaturedCategories";
import DynamicServicesSection from "@/components/pages/home/DynamicServicesSection";
import SectionDivider from "@/components/ui/SectionDivider";
import { generateSEO } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = generateSEO({
  title: "Shop Unique Gifts Online | AweGift",
  description: "Discover incredible deals on personalized gifts, luxury presents, custom items, and thoughtful surprises. Fast shipping, secure checkout, and unbeatable prices at AweGift.",
  keywords: ["online shopping", "ecommerce", "gifts", "personalized gifts", "luxury presents", "custom gifts", "birthday gifts", "fast shipping"],
  image: "/logo.png",
  url: "/",
});

export default function Home() {
  return (
    <main>
     <Banner />

      {/* Featured Categories Section */}
      <DynamicFeaturedCategories />

      <SectionDivider />

      <DynamicServicesSection />

      <SectionDivider />

      {/* Products Section */}
      <Products />
    </main>
  );
}
