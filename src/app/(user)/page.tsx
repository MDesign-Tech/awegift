import Banner from "@/components/pages/home/Banner";
import Products from "@/components/pages/home/Products";
import DynamicFeaturedCategories from "@/components/pages/home/DynamicFeaturedCategories";
import FAQClient from "@/components/FAQClient";
import SectionDivider from "@/components/ui/SectionDivider";
import HomeFlexCarousel from "@/components/pages/home/HomeFlexCarousel";

export default function Home() {
  return (
    <main>
      <Banner />

      <HomeFlexCarousel
        preset="arch"
        intro="none"
        cardHeight={0.5}
        gap={12}
        squeeze={0.2}
        focusOnClick
        captions
        fit="natural"
        radius={15}
        lensWidth={0.8}
        lensHeight={0.79}
        tilt={0}
        roundness={0.02}
        bend={0.3}
        reach={0.36}
        curl="fall"
        dispersion={0.4}
        liquid={0}
        followCursor
        autoplay
        interval={4}
        captureWheel
      />

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
