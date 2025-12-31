"use client"

import HeroBanner from "@/components/HeroBanner"
import { bannerImages } from "@/assets"
import Container from "@/components/Container"

const BannerData = {
  title: "Welcome to AweGift",
  buttonText: "Shop Now",
  buttonHref: "/products",
  images: bannerImages,
  promoCards: [
    {
      id: "calendars",
      title: "Wallet products",
      image: bannerImages[0].src,
    },
    {
      id: "books",
      title: "Wallet",
      image: bannerImages[1].src,
    },
    {
      id: "ornaments",
      title: "Watch",
      image: bannerImages[2].src,
    },
    {
      id: "blanket",
      title: "Bottle",
      image: bannerImages[3].src,
    },
  ],
}

export function Banner() {
  return (
    <HeroBanner
      {...BannerData}
      backgroundColor="bg-rose-100"
      textColor="text-gray-900"
      autoSlideInterval={5000}
    />
  )
}
