import Banner from "@/components/pages/home/Banner";
import Products from "@/components/pages/home/Products";
import DynamicFeaturedCategories from "@/components/pages/home/DynamicFeaturedCategories";
import FAQClient from "@/components/FAQClient";
import SectionDivider from "@/components/ui/SectionDivider";

export default function Home() {
  return (
    <main>
      <Banner />

      {/* Featured Categories Section */}
      <DynamicFeaturedCategories />

      <SectionDivider />

      {/* Products Section */}
      <Products />

      <SectionDivider />

      {/* Frequently Asked Questions Section */}
      <FAQClient />
    </main>
  );
}
