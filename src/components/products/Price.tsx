"use client";
import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronDown } from "react-icons/fa";

import { useCurrency } from "@/contexts/CurrencyContext";

interface PriceProps {
  allProducts?: any[];
}

const Price = ({ allProducts = [] }: PriceProps) => {
  const [isOpen, setIsOpen] = useState(false); // Collapsed by default
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentMinPrice = searchParams.get("min_price");
  const currentMaxPrice = searchParams.get("max_price");
  const { convertPrice, getCurrencySymbol, selectedCurrency } = useCurrency();

  const handlePriceClick = (minPrice: number, maxPrice: number) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    // If it's the "Above X" option (Infinity), we just clear max_price
    if (maxPrice === Infinity) {
      current.delete("max_price");
    } else {
      current.set("max_price", maxPrice.toString());
    }

    current.set("min_price", minPrice.toString());

    const search = current.toString();
    const query = search ? `?${search}` : "";
    router.push(`/products${query}`);
  };

  // Generate dynamic price ranges based on 10k RWF steps
  const generatePriceRanges = () => {
    // Current requirement: Interval of 10k RWF
    // 5 intervals total, last one is "Above X"

    const baseStepRWF = 10000;
    const ranges = [];
    const maxIntervals = 5;

    // Find minimum product price
    let minProductPrice = 0;
    if (allProducts && allProducts.length > 0) {
      minProductPrice = allProducts.reduce((min, p) => (p.price < min ? p.price : min), allProducts[0].price);
      // Floor it to be clean? Or keep exact? User said "start on minimum product price".
      // Let's floor it to nearest integer for cleanliness if it's decimal.
      minProductPrice = Math.floor(minProductPrice);
    }

    for (let i = 0; i < maxIntervals; i++) {
      // Calculate bounds in RWF first (assuming this is effectively the usage for filtering/logic)
      // Note: Ideally we pass values that match the DB currency. Assuming DB/Backend uses RWF or raw numbers matching this scale.
      // If we want to support switching, we should make sure the URL params represent the correct value for the server filter.
      // Based on user request "interval of adding 10 k RWF", we stick to RWF steps.

      const minRWF = minProductPrice + (i * baseStepRWF);
      const maxRWF = minProductPrice + ((i + 1) * baseStepRWF);
      const isLast = i === maxIntervals - 1;

      ranges.push({
        min: minRWF,
        max: isLast ? Infinity : maxRWF,
        isLast
      });
    }

    return ranges;
  };

  const priceRanges = generatePriceRanges();

  // Helper to format price for display (converting from RWF base)
  const formatPrice = (amount: number) => {
    const converted = convertPrice(amount, "RWF");
    // Format with reasonable decimals (0 for RWF, 2 for USD usually, but toFixed(0) is cleaner for filters unless small)
    // If currency is RWF, decimals 0. If USD, maybe 2.
    const decimals = selectedCurrency === "RWF" ? 0 : 2;
    return `${getCurrencySymbol(selectedCurrency)}${converted.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  };

  return (
    <div className="w-full">
      {/* Accordion Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 px-0 text-left focus:outline-none group"
      >
        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-theme-color transition-colors">
          Price
        </h3>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <FaChevronDown className="w-4 h-4 text-gray-500" />
        </motion.div>
      </button>

      {/* Accordion Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-2 pb-4">
              <div className="space-y-2">
                {priceRanges.map((range, index) => {
                  const isActive =
                    currentMinPrice === range.min.toString() &&
                    (range.isLast
                      ? !currentMaxPrice // If last, active if min matches and no max
                      : currentMaxPrice === range.max.toString());

                  const priceRangeId = `price-${range.min}-${range.max}`;

                  return (
                    <div key={index} className="flex items-center">
                      <input
                        type="radio"
                        id={priceRangeId}
                        name="priceRange"
                        checked={isActive}
                        onChange={() => { }}
                        className="w-4 h-4 text-theme-color bg-gray-100 border-gray-300 focus:ring-theme-color focus:ring-2"
                      />
                      <button
                        onClick={() => handlePriceClick(range.min, range.max)}
                        className="ml-2 text-sm font-medium text-gray-900 hover:text-theme-color transition-colors flex-1 text-left"
                      >
                        {range.isLast
                          ? `Above ${formatPrice(range.min)}`
                          : `${formatPrice(range.min)} - ${formatPrice(range.max)}`
                        }
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Price;
