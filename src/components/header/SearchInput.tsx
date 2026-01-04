"use client";

import { useEffect, useRef, useState } from "react";
import { RiCloseLine, RiSearchLine } from "react-icons/ri";
import Link from "next/link";
import Image from "next/image";
import { CiSearch } from "react-icons/ci";
import { useProductSearch } from "@/hooks/useProductSearch";
import PriceFormat from "../PriceFormat";
import { ProductType } from "../../../type";
import { motion, AnimatePresence } from "framer-motion";

const SearchInput = () => {
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isDesktopInputFocused, setIsDesktopInputFocused] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const desktopInputRef = useRef<HTMLInputElement>(null);

  const {
    search,
    setSearch,
    filteredProducts,
    suggestedProducts,
    isLoading,
    hasSearched,
    clearSearch,
  } = useProductSearch({ debounceDelay: 300 });

  // Mobile: Focus input when drawer opens
  useEffect(() => {
    if (isMobileSearchOpen && mobileInputRef.current) {
      mobileInputRef.current.focus();
    }
  }, [isMobileSearchOpen]);

  // Click outside listener for both Desktop Dropdown and Mobile Drawer
  // Note: For mobile drawer, usually we have an overlay or button to close, but click outside is safe too.
  // For Desktop, we need to hide the dropdown when clicking outside.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsMobileSearchOpen(false);
        setIsDesktopInputFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleClearSearch = () => {
    clearSearch();
    // Re-focus whichever input is active
    if (isMobileSearchOpen) mobileInputRef.current?.focus();
    else desktopInputRef.current?.focus();
  };

  const handleProductClick = () => {
    clearSearch();
    setIsMobileSearchOpen(false);
    setIsDesktopInputFocused(false);
  };

  // Reusable Results Component
  const renderResults = (isMobile: boolean = false) => (
    <div
      className={`
        ${
          isMobile
            ? "max-h-[70vh] bg-white/95 backdrop-blur-md"
        // : "max-h-[500px] bg-white border border-gray-200 shadow-xl rounded-b-md"
        : "max-h-[500px] bg-white border border-gray-200 shadow-xl rounded-xl"
        } 
        overflow-y-auto custom-scrollbar
    `}
    >
      {/* Loading State */}
      {isLoading && (
        <div className="py-8 px-5 text-center">
          <div className="flex items-center justify-center space-x-2">
            <div
              className="w-2 h-2 bg-theme-color rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-theme-color rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-theme-color rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            ></div>
          </div>
          <p className="text-sm text-gray-500 mt-2">Searching...</p>
        </div>
      )}

      {/* No products found */}
      {!isLoading && hasSearched && filteredProducts?.length === 0 && (
        <div className="py-8 px-5 text-center">
          <p className="text-gray-600">
            No results found for{" "}
            <span className="font-bold text-black">&quot;{search}&quot;</span>
          </p>
        </div>
      )}

      {/* Found Products */}
      {!isLoading && filteredProducts?.length > 0 && (
        <div className="flex flex-col">
          {filteredProducts.map((item: ProductType) => (
            <Link
              key={item?.id}
              href={`/products/${item?.id}`}
              onClick={handleProductClick}
              className="group flex items-center gap-4 px-5 py-3 border-b border-gray-50 hover:bg-gray-50 duration-75 transition-colors"
            >
              <div className="w-10 h-10 min-w-[40px] bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 group-hover:bg-white group-hover:shadow-sm duration-200 overflow-hidden relative">
                {item?.thumbnail || item?.images?.[0] ? (
                  <Image
                    src={item?.thumbnail || item?.images?.[0]}
                    alt={item?.title}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <CiSearch className="text-xl" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-theme-color transition-colors">
                  {item?.title}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {item?.categories?.[0] || "Product"}
                </p>
              </div>
              <PriceFormat
                amount={item?.price}
                className="text-sm font-bold text-gray-900"
              />
            </Link>
          ))}
        </div>
      )}

      {/* Suggested/Trending */}
      {!search && !isLoading && suggestedProducts?.length > 0 && (
        <div className="p-2">
          <div className="px-3 py-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Trending Now
            </p>
          </div>
          {suggestedProducts.map((item: ProductType) => (
            <Link
              key={item?.id}
              href={`/products/${item?.id}`}
              onClick={handleProductClick}
              className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors"
            >
              <div className="w-2 h-2 rounded-full bg-theme-color"></div>
              <p className="text-sm font-medium text-gray-700 flex-1 truncate">
                {item?.title}
              </p>
              <PriceFormat
                amount={item?.price}
                className="text-xs font-semibold text-gray-500"
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div ref={searchContainerRef} className="relative">
      {/* =======================
          MOBILE VIEW (< md)
          Icon Trigger + Drawer
      ======================== */}
      <div className="md:hidden">
        <button
          onClick={() => setIsMobileSearchOpen((prev) => !prev)}
          className="text-2xl hover:text-theme-color duration-200 cursor-pointer flex items-center justify-center mt-1.5"
          aria-label="Toggle Mobile Search"
        >
          <RiSearchLine />
        </button>

        <AnimatePresence>
          {isMobileSearchOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20, scaleY: 0.9 }}
              animate={{ opacity: 1, y: 0, scaleY: 1 }}
              exit={{ opacity: 0, y: -20, scaleY: 0.9 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-28 left-1/2 -translate-x-1/2 w-[90vw] max-w-lg z-50 origin-top"
            >
              <div className="bg-white rounded-md shadow-2xl border border-gray-200 overflow-hidden">
                <div className="relative flex items-center h-14 border-b border-gray-100 px-4 bg-white">
                  <CiSearch className="text-2xl text-gray-400 mr-3" />
                  <input
                    ref={mobileInputRef}
                    type="text"
                    placeholder="Search products..."
                    className="flex-1 h-full outline-hidden text-gray-700 placeholder:text-gray-400 font-medium"
                    value={search}
                    onChange={handleSearchChange}
                  />
                  {search && (
                    <button
                      onClick={handleClearSearch}
                      className="text-gray-400 hover:text-red-500 duration-200 mr-2"
                    >
                      <RiCloseLine className="text-xl" />
                    </button>
                  )}
                  <button
                    onClick={() => setIsMobileSearchOpen(false)}
                    className="text-sm font-semibold text-gray-500 hover:text-black duration-200 border-l pl-3 ml-1 border-gray-200"
                  >
                    ESC
                  </button>
                </div>
                {/* Render Results Logic */}
                {renderResults(true)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* =======================
          DESKTOP VIEW (>= md)
          Inline Input + Dropdown
      ======================== */}
      <div className="hidden md:block relative w-[300px] lg:w-[400px] mx-auto">
        <div className="flex items-center w-full h-10 border-1 border-theme-color focus-within:border-theme-color focus-within:ring-1 focus-within:ring-theme-color transition-all duration-200 bg-gray-50/50 rounded-full">
          <CiSearch className="text-xl font-bold text-theme-color ml-3" />
          <input
            ref={desktopInputRef}
            type="text"
            placeholder="Search for products..."
            className="flex-1 h-full px-3 outline-none bg-transparent text-sm text-gray-700 placeholder:text-gray-500"
            value={search}
            onChange={handleSearchChange}
            onFocus={() => setIsDesktopInputFocused(true)}
          />
          {search && (
            <button
              onClick={handleClearSearch}
              className="mr-3 text-gray-400 hover:text-theme-color transition-colors"
            >
              <RiCloseLine />
            </button>
          )}
        </div>

        {/* Desktop Results Dropdown */}
        <AnimatePresence>
          {isDesktopInputFocused &&
            (search || (suggestedProducts && suggestedProducts.length > 0)) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
              // className="absolute top-12 left-0 w-full z-50"
              className="absolute top-12 left-0 w-full z-50 rounded-xl overflow-hidden"
                
              >
                {renderResults(false)}
              </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SearchInput;
