"use client";

import { useState } from "react";
interface Props {
  images: string[];
  thumbsail?: string;
}

const ProductImages = ({ images , thumbsail }: Props) => {
  const thumbnailImages = thumbsail ? [thumbsail, ...images.filter(img => img !== thumbsail)] : images;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const currentImage = thumbnailImages[currentIndex] || '';

  const changeImage = (index: number) => {
    setOpacity(0);
    setTimeout(() => {
      setCurrentIndex(index);
      setOpacity(1);
    }, 500);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image */}
      <div className="order-1 bg-gray-100 rounded-md w-full max-h-[400px] md:max-h-[550px]">
        {currentImage && (
          <img
            src={currentImage}
            alt="mainImage"
            className={`w-full h-full rounded-md object-contain transition-opacity duration-500 ${opacity === 0 ? 'opacity-0' : 'opacity-100'}`}
          />
        )}
      </div>
      {/* Thumbnails */}
      <div className="order-2 flex gap-2 flex-row md:gap-2 overflow-x-auto ">
        {thumbnailImages?.map((item, index) => (
          <img
            src={item}
            alt="productImage"
            key={index}
            className={`w-16 h-16 md:w-24 md:h-24 object-contain cursor-pointer opacity-80 hover:opacity-100 duration-300 border border-gray-200 rounded-md flex-shrink-0 ${
              currentImage === item && "border-gray-500 opacity-100"
            }`}
            onClick={() => changeImage(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default ProductImages;
