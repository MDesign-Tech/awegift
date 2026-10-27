import Image from "next/image";
import {
  brandingImages,
  packagingImages,
  photographyImages,
  socialMediaImages,
} from "@/assets";

const mockups = [
  { ...socialMediaImages[0], position: "mockup-card--1" },
  { ...packagingImages[1], position: "mockup-card--2" },
  { ...brandingImages[2], position: "mockup-card--3" },
  { ...photographyImages[1], position: "mockup-card--4" },
  { ...brandingImages[4], position: "mockup-card--5" },
];

export default function MockupShowcase() {
  return (
    <section className="mockup-showcase" aria-label="AweGift mockup showcase">
      <div className="mockup-showcase__track">
        {mockups.map((mockup, index) => (
          <div className={`mockup-card ${mockup.position}`} key={mockup.src}>
            <Image
              src={mockup.src}
              alt={mockup.alt}
              fill
              priority={index < 2}
              sizes="(max-width: 640px) 72vw, (max-width: 1024px) 36vw, 20vw"
              className="mockup-card__image"
              unoptimized={mockup.src.endsWith(".gif")}
            />
            <span className="mockup-card__slash" aria-hidden="true" />
          </div>
        ))}
      </div>
    </section>
  );
}
