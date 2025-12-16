// Static paths for images served from public folder
export const logo = "/logo.png";
export const notFound = "/notFound.png";
export const bannerImageOne = "/bannerImageOne.png";

// Banner images
import banner1 from "./banner/Hero section images - awegift-01.png";
import banner2 from "./banner/Hero section images - awegift-02.png";
import banner3 from "./banner/Hero section images - awegift-03.png";
import banner4 from "./banner/Hero section images - awegift-04.png";
import banner5 from "./banner/Hero section images - awegift-05.png";
import banner6 from "./banner/Hero section images - awegift-06.png";

export const bannerImages = [
  { src: banner1.src, alt: "Hero section 1" },
  { src: banner2.src, alt: "Hero section 2" },
  { src: banner3.src, alt: "Hero section 3" },
  { src: banner4.src, alt: "Hero section 4" },
  { src: banner5.src, alt: "Hero section 5" },
  { src: banner6.src, alt: "Hero section 6" },
];

// Keep webp import for optimization (webp is better supported by Next.js)
import paymentImage from "./payment.webp";
export { paymentImage };
