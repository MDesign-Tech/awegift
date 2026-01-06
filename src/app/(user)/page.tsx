
import Banner from "@/components/pages/home/Banner";
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
    </main>
  );
}
