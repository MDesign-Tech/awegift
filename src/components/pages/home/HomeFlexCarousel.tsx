import FlexCarousel from "@/components/FlexCarousel";
import {
  brandingImages,
  packagingImages,
  socialMediaImages,
  weddingImages,
} from "@/assets";
import "./HomeFlexCarousel.css";

const carouselItems = [
  ...socialMediaImages.map((image, index) => ({
    ...image,
    title: `Social campaign ${index + 1}`,
  })),
  ...weddingImages.map((image, index) => ({
    ...image,
    title: `Wedding invitation ${index + 1}`,
  })),
  ...packagingImages.map((image, index) => ({
    ...image,
    title: `Packaging design ${index + 1}`,
  })),
  ...brandingImages.map((image, index) => ({
    ...image,
    title: `Brand identity ${index + 1}`,
  })),
];

type HomeFlexCarouselProps = {
  preset?: "liquid" | "ribbon" | "vortex" | "arch";
  intro?: "rise" | "bloom" | "spin" | "deal" | "none";
  cardHeight?: number;
  gap?: number;
  squeeze?: number;
  focusOnClick?: boolean;
  captions?: boolean;
  fit?: "natural" | "portrait" | "square" | "landscape";
  radius?: number;
  lensWidth?: number;
  lensHeight?: number;
  tilt?: number;
  roundness?: number;
  bend?: number;
  reach?: number;
  curl?: "twist" | "rise" | "fall";
  dispersion?: number;
  liquid?: number;
  followCursor?: boolean;
  autoplay?: boolean;
  interval?: number;
  captureWheel?: boolean;
};

export default function HomeFlexCarousel(props: HomeFlexCarouselProps) {
  return (
    <section
      className="home-flex-carousel-section"
      aria-label="Featured AweGift designs"
    >
      <div className="home-flex-carousel-inner">
        <FlexCarousel
          items={carouselItems}
          {...props}
          className="home-flex-carousel"
        />
      </div>
    </section>
  );
}
