import Banner from "@/components/pages/home/Banner";
import ProductSection from "@/components/pages/home/ProductSection";
import DynamicFeaturedCategories from "@/components/pages/home/DynamicFeaturedCategories";
import SpecialOffersBanner from "@/components/pages/home/SpecialOffersBanner";
import SectionDivider from "@/components/ui/SectionDivider";
import { getData } from "./helpers";
import {
  getBestSellers,
  getNewArrivals,
  getOffers,
} from "./helpers/productHelpers";
import { absoluteUrl } from "./products/page";

export default async function Home() {
  const endpoint = absoluteUrl(`/api/products?limit=0`);
  const productData = await getData(endpoint);
  const allProducts = productData?.products || [];

  // Categorize products
  const bestSellers = getBestSellers(allProducts);
  const newArrivals = getNewArrivals(allProducts);
  const offers = getOffers(allProducts);

  return (
    <main>
      <Banner />

      {/* Featured Categories Section */}
      <DynamicFeaturedCategories />

      <SectionDivider />

      {/* Best Sellers Section */}
      <ProductSection
        title="Best Sellers"
        subtitle="Our most popular products loved by customers"
        products={bestSellers}
        viewMoreLink="/products?category=bestsellers"
      />

      <SectionDivider />

      {/* New Arrivals Section */}
      <ProductSection
        title="New Arrivals"
        subtitle="Latest products just added to our collection"
        products={newArrivals}
        viewMoreLink="/products?category=new"
      />

      <SectionDivider />

      {/* Special Offers Section */}
      <ProductSection
        title="Special Offers"
        subtitle="Don't miss out on these amazing deals"
        products={offers}
        viewMoreLink="/offers"
      />
    </main>
  );
}
