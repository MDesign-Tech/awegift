"use client";
import React, { useEffect, useState } from "react";
import { ProductType, StateType } from "../../type";
import AddToCartButton from "./AddToCartButton";
import Link from "next/link";
import ProductPrice from "./ProductPrice";
import { FaStar, FaWhatsapp } from "react-icons/fa";
import ProductActionsClient from "./ProductActionsClient";
import { MdFavorite, MdFavoriteBorder } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { useSession } from "next-auth/react";
import { addToFavorite } from "@/redux/shofySlice";
import toast from "react-hot-toast";

interface Props {
  product: ProductType;
}

const ProductCard = ({ product }: Props) => {
  const dispatch = useDispatch();
  const { data: session } = useSession();
  const { favorite } = useSelector((state: StateType) => state?.aweGift);
  const [isFavorite, setIsFavorite] = useState(false);

  const regularPrice = product?.price;

  // Check if product is in favorites
  useEffect(() => {
    if (session?.user) {
      const isInFavorites = favorite?.some((item) => item.id === product.id);
      setIsFavorite(!!isInFavorites);
    }
  }, [favorite, product.id, session?.user]);

  return (
    <div className="bg-white border border-gray-200 rounded-xl hover:shadow-xl hover:shadow-black/10 transition-all duration-300 overflow-hidden group transform hover:-translate-y-1 relative">
      {/* Image Section */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <Link
          href={{
            pathname: `/products/${product?.id}`,
            query: { id: product?.id },
          }}
        >
          {product?.thumbnail ? (
            <img
              src={product.thumbnail}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <svg
                className="h-8 w-8 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
        </Link>

        {/* {product?.discountPercentage > 0 && (
          <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg z-10 animate-pulse">
            -{Math.round(product.discountPercentage)}% OFF
          </div>
        )} */}

        {/* Stock Badge
        {product?.stock <= 5 && product?.stock > 0 && (
          <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold shadow-lg">
            Only {product.stock} left!
          </div>
        )}

        {product?.stock === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg">
              OUT OF STOCK
            </div>
          </div>
        )} */}

        {/* Quick Actions */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
          <ProductActionsClient product={product} />
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
            {product?.categories && product.categories.length > 0 ? product.categories[0] : "No category"}
          </p>
          <div className="flex bg-blue-50 px-2 py-1 rounded-full items-center gap-1">
            <a
              href={`https://wa.me/250781990310?text=Hi%20I%20need%20more%20about%20this%20product%20(${encodeURIComponent(product?.title || "this product")})`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-500 hover:text-green-700 transition-colors duration-200 text-sm"
              title="Contact us on WhatsApp"
            >
              <FaWhatsapp />
            </a>
            {product?.brand && (
              <span className="text-xs text-blue-600 font-medium">
                {product.brand}
              </span>
            )}
          </div>
        </div>

        <Link
          href={{
            pathname: `/products/${product?.id}`,
            query: { id: product?.id },
          }}
        >
          <h3 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-1 mb-3 leading-tight">
            {product?.title}
          </h3>
        </Link>

        {/* Rating
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <FaStar
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i < Math.floor(product?.rating)
                      ? "text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-600 ml-1">
              ({product?.rating})
            </span>
          </div>

          {product?.stock > 0 && (
            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-medium">
              In Stock
            </span>
          )}
        </div> */}

        {/* Price */}
        <div className="mb-4">
          <ProductPrice
            regularPrice={regularPrice}
            product={product}
          />
        </div>

        {/* Add to Cart Button */}
        <AddToCartButton
          product={product}
          variant="outline"
          size="sm"
          className="w-full group-hover:variant-primary transition-all duration-300"
        />
      </div>
    </div>
  );
};

export default ProductCard;
