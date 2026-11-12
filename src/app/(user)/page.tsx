import Banner from "@/components/pages/home/Banner";
import Products from "@/components/pages/home/Products";
import DynamicFeaturedCategories from "@/components/pages/home/DynamicFeaturedCategories";
import ServicesPromotion from "@/components/pages/home/ServicesPromotion";
import FAQClient from "@/components/FAQClient";
import SectionDivider from "@/components/ui/SectionDivider";
import HomeFlexCarousel from "@/components/pages/home/HomeFlexCarousel";
import JsonLd from "@/components/JsonLd";
import { SITE_URL } from "@/lib/seo";

export default function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "AweGift",
        url: `${SITE_URL}/`,
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/AWEGIFT%20LOGO.svg`,
        },
        image: `${SITE_URL}/og-image.svg`,
        description:
          "AweGift is your online showroom for personalized products, custom printing, branding materials, packaging, promotional products, corporate gifts and supplies in Rwanda.",
        email: "support@aweegift.com",
        telephone: "+250781990310",
        areaServed: {
          "@type": "Country",
          name: "Rwanda",
        },
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: `${SITE_URL}/`,
        name: "AweGift",
        publisher: { "@id": `${SITE_URL}/#organization` },
        inLanguage: "en",
        potentialAction: {
          "@type": "SearchAction",
          target: `${SITE_URL}/products?search={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <main>
      <JsonLd data={structuredData} />
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
        bend={0}
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

      {/* <ServicesPromotion /> */}

      <SectionDivider />

      {/* Products Section */}
      <Products />

      <SectionDivider />

      {/* Frequently Asked Questions Section */}
      <FAQClient />
    </main>
  );
}
