"use client";

import { useState, useEffect } from "react";
import Container from "@/components/Container";
import Button from "@/components/ui/Button";
import { banner } from "@/constants";
import { bannerImages } from "@/assets";
import { GoArrowRight, GoChevronLeft, GoChevronRight } from "react-icons/go";
import PriceFormat from "../../PriceFormat";

const Banner = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto slide every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerImages.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % bannerImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + bannerImages.length) % bannerImages.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <div className="bg-[#115061] py-8 text-theme-white relative overflow-hidden">
      <Container className="flex flex-col md:flex-row items-center justify-between relative z-10">
        <div className="flex w-full flex-col gap-5">
          
          <h2 className="text-3xl md:text-5xl font-bold max-w-[400px] md:max-w-[500px]">{banner?.title}</h2>
          
          <Button
            href={banner?.buttonLink}
            className="flex items-center gap-1 bg-theme-white text-black rounded-md w-32 px-0 justify-center text-sm font-semibold hover:bg-transparent hover:text-theme-white py-3 border border-transparent hover:border-white/40 duration-200"
          >
            Shop Now <GoArrowRight className="text-lg" />
          </Button>
        </div>
        <div className="relative mt-3">
          <div className="relative w-full md:w-[400px] h-[300px] md:h-[400px] overflow-hidden rounded-lg">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {bannerImages.map((image, index) => (
                <img
                  key={index}
                  src={image.src}
                  alt={image.alt}
                  className="w-full md:w-[400px] h-[300px] md:h-[400px] object-contain flex-shrink-0"
                />
              ))}
            </div>
          </div>


          {/* Dots indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {bannerImages.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentSlide ? "bg-white" : "bg-white/50"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Banner;

