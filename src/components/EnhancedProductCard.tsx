import React from "react";
import { ProductType } from "../../type";
import AddToCartButton from "./AddToCartButton";
import Link from "next/link";
import ProductPrice from "./ProductPrice";
import { FaStar, FaHeart, FaWhatsapp } from "react-icons/fa";
import ProductActionsClient from "./ProductActionsClient";

interface Props {
  product: ProductType;
  view?: "grid" | "list";
}

const EnhancedProductCard = ({ product, view = "grid" }: Props) => {
  const regularPrice = product?.price;
  // const discountedPrice =
  //   product?.price - (product?.price * product?.discountPercentage) / 100;

  if (view === "list") {
    return (
      <div className="bg-white border border-gray-200 rounded-xl hover:shadow-xl hover:shadow-black/5 transition-all duration-300 overflow-hidden group">
        <div className="flex">
          {/* Image Section */}
          <div className="w-48 h-48 flex-shrink-0 bg-light-bg relative group/image">
            <Link href={`/products/${product?.id}`}>
              {product?.thumbnail ? (
                <img
                  src={product.thumbnail}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover/image:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-light-bg">
                  <svg
                    className="h-12 w-12 text-gray-400"
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
              <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                -{Math.round(product.discountPercentage)}% OFF
              </div>
            )} */}

            {/* Quick Actions */}
            {product?.stock === 0 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="bg-red-500 text-white px-3 py-2 rounded-lg font-bold text-sm">
                  OUT OF STOCK
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover/image:opacity-100 transition-opacity">
              <ProductActionsClient product={product} />
            </div>
          </div>



          {/* Content Section */}
          <div className="flex-1 p-4 sm:p-6 flex flex-col min-w-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-sm text-gray-500 uppercase tracking-wide truncate">
                  {product?.categories && product.categories.length > 0 ? product.categories[0] : "No category"}
                </p>
                <div className="flex bg-light-bg px-2 py-1 rounded-full items-center gap-1 flex-shrink-0">
                  <a
                    href={`https://wa.me/250781990310?text=Hi%20I%20need%20more%20about%20this%20product%20(${encodeURIComponent(product?.title || "this product")})`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-500 hover:text-green-700 transition-colors duration-200 text-sm"
                    title="Contact us on WhatsApp"
                  >
                    <FaWhatsapp className="size-5" />
                  </a>
                </div>
              </div>

              <Link href={`/products/${product?.id}`}>
                <h3 className="text-lg font-semibold text-gray-900 hover:text-theme-color transition-colors line-clamp-1 sm:line-clamp-2 mb-2">
                  {product?.title}
                </h3>
              </Link>

              <p className="text-gray-600 text-sm line-clamp-2 mb-3 hidden sm:block">
                {product?.description}
              </p>

              <div className="mb-4">
                <ProductPrice
                  regularPrice={regularPrice}
                  product={product}
                />
              </div>
            </div>

            {/* Action Button at Bottom */}
            <div className="mt-auto pt-2">
              <AddToCartButton
                product={product}
                variant="primary"
                size="md"
                className="w-full sm:w-auto shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid View
  return (
    <div className="bg-white border border-gray-200 rounded-xl hover:shadow-xl hover:shadow-black/10 transition-all duration-300 overflow-hidden group transform hover:-translate-y-1">
      {/* Image Section */}
      <div className="relative aspect-square overflow-hidden bg-light-bg">
        <Link href={`/products/${product?.id}`}>
          {product?.thumbnail ? (
            <img
              src={product.thumbnail}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-light-bg">
              <svg
                className="h-12 w-12 text-gray-400"
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
        )}

        {/* Stock Badge */}
        {/* {product?.stock <= 5 && product?.stock > 0 && (
          <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold shadow-lg">
            Only {product.stock} left!
          </div>
        )} 
         */}

        {product?.stock === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg">
              OUT OF STOCK
            </div>
          </div>
        )}

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
          <div className="flex bg-light-bg px-2 py-1 rounded-full items-center gap-1">
            <a
              href={`https://wa.me/250781990310?text=Hi%20I%20need%20more%20about%20this%20product%20(${encodeURIComponent(product?.title || "this product")})`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-500 hover:text-green-700 transition-colors duration-200 text-sm"
              title="Contact us on WhatsApp"
            >
              <FaWhatsapp className="size-5" />
            </a>
          </div>
        </div>

        <Link href={`/products/${product?.id}`}>
          <h3 className="font-semibold text-gray-900 hover:text-theme-color transition-colors truncate mb-3 leading-tight text-sm">
            {product?.title}
          </h3>
        </Link>

        {/* Rating and Stock in flex-col
        <div className="flex flex-col gap-2 mb-3">
          {/* Rating */}
        {/* <div className="flex items-center gap-1">
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

          {/* Stock Status */}
        {/* {product?.stock > 0 && (
            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-medium w-fit">
              In Stock ({product.stock})
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

export default EnhancedProductCard;
