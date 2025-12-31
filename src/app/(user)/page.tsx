
import { Banner } from "@/components/pages/home/Banner";
import BestSellersSection from "@/components/pages/home/BestSellersSection";
import DynamicFeaturedCategories from "@/components/pages/home/DynamicFeaturedCategories";
import SectionDivider from "@/components/ui/SectionDivider";

export default function Home() {
  return (
    <main>
     <Banner />

      {/* Featured Categories Section */}
      <DynamicFeaturedCategories />

      <SectionDivider />

      {/* Best Sellers Section */}
      <BestSellersSection />

      {/* New Arrivals Section - Commented out as in original
      <ProductSection
        title="New Arrivals"
        subtitle="Latest products just added to our collection"
        products={newArrivals}
        viewMoreLink="/products?category=new"
      /> */}

      {/* Special Offers Section - Commented out as in original
      <ProductSection
        title="Special Offers"
        subtitle="Don't miss out on these amazing deals"
        products={offers}
        viewMoreLink="/offers"
      /> */}
    </main>
  );
}
