
import Banner from "@/components/pages/home/Banner";
import Products from "@/components/pages/home/Products";
import DynamicFeaturedCategories from "@/components/pages/home/DynamicFeaturedCategories";
import DynamicServicesSection from "@/components/pages/home/DynamicServicesSection";
import SectionDivider from "@/components/ui/SectionDivider";

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
