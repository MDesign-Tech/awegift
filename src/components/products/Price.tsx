"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronDown, FaCheck } from "react-icons/fa";

import PriceFormat from "../PriceFormat";

interface PriceProps {
  allProducts?: any[];
}

const Price = ({ allProducts = [] }: PriceProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentMin = searchParams.get("min_price");
  const currentMax = searchParams.get("max_price");

  /* ----------------------------------------
     Price boundaries
  ----------------------------------------- */
  const { minPrice, maxPrice } = useMemo(() => {
    const prices = allProducts.map(p => p.price).filter(Boolean);
    return {
      minPrice: prices.length ? Math.min(...prices) : 0,
      maxPrice: prices.length ? Math.max(...prices) : 0,
    };
  }, [allProducts]);

  /* ----------------------------------------
     Local state (no router updates)
  ----------------------------------------- */
  const [minValue, setMinValue] = useState(Number(currentMin ?? minPrice));
  const [maxValue, setMaxValue] = useState(Number(currentMax ?? maxPrice));
  const [pendingApply, setPendingApply] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setMinValue(Number(currentMin ?? minPrice));
    setMaxValue(Number(currentMax ?? maxPrice));
    setPendingApply(false);
  }, [currentMin, currentMax, minPrice, maxPrice]);

  /* ----------------------------------------
     Slider handlers
  ----------------------------------------- */
  const onMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setMinValue(val);
    if (val > maxValue) setMaxValue(val);
    setPendingApply(true);
  };

  const onMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setMaxValue(val);
    if (val < minValue) setMinValue(val);
    setPendingApply(true);
  };

  /* ----------------------------------------
     Apply filter
  ----------------------------------------- */
  const applyFilter = () => {
    const params = new URLSearchParams(searchParams.toString());

    minValue !== minPrice
      ? params.set("min_price", String(minValue))
      : params.delete("min_price");

    maxValue !== maxPrice
      ? params.set("max_price", String(maxValue))
      : params.delete("max_price");

    router.replace(`/products?${params.toString()}`, { scroll: false });
    setPendingApply(false);
  };

  return (
    <div className="w-full">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center py-3"
      >
        <h3 className="text-lg text-gray-900 font-semibold">Price</h3>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
          <FaChevronDown />
        </motion.div>
      </button>

      {/* Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-4 pb-4">
              {/* Current values */}
              <div className="flex justify-between text-sm">
                <PriceFormat amount={minValue} />
                <PriceFormat amount={maxValue} />
              </div>

              {/* Slider + Apply icon */}
              <div className="flex items-center gap-3">
                {/* Volume-style range */}
                <div className="relative flex-1 h-2 rounded-full bg-gray-200">
                  {/* Active range */}
                  <div
                    className="absolute h-2 bg-theme-color rounded-full"
                    style={{
                      left: `${((minValue - minPrice) / (maxPrice - minPrice)) * 100}%`,
                      right: `${100 - ((maxValue - minPrice) / (maxPrice - minPrice)) * 100}%`,
                    }}
                  />

                  {/* Sliders */}
                  <input
                    type="range"
                    min={minPrice}
                    max={maxPrice}
                    value={minValue}
                    onChange={onMinChange}
                    className="range-input z-10"
                  />
                  <input
                    type="range"
                    min={minPrice}
                    max={maxPrice}
                    value={maxValue}
                    onChange={onMaxChange}
                    className="range-input z-20"
                  />
                </div>

                {/* Apply (checkbox-style icon) */}
                <button
                  onClick={applyFilter}
                  disabled={!pendingApply}
                  className={`w-6 h-6 flex items-center justify-center rounded-full border transition
                    ${pendingApply
                      ? "bg-theme-color text-white border-theme-color"
                      : "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"
                    }`}
                  title="Apply price filter"
                >
                  <FaCheck className="text-xs" />
                </button>
              </div>

              {/* Min / Max */}
              <div className="flex justify-between text-xs text-gray-500">
                <PriceFormat amount={minPrice} />
                <PriceFormat amount={maxPrice} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slider styles */}
      <style jsx>{`
  .range-input {
    position: absolute;
    width: 100%;
    height: 8px;
    appearance: none;
    background: transparent;
    pointer-events: auto;
  }

  /* Remove default track */
  .range-input::-webkit-slider-runnable-track {
    background: transparent;
  }
  .range-input::-moz-range-track {
    background: transparent;
  }

  /* === THUMB (Windows volume style) === */
  .range-input::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 9999px;
    background: #ed4c07;
    cursor: pointer;
    box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }

  .range-input::-webkit-slider-thumb:hover {
    transform: scale(1.1);
    box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.08);
  }

  .range-input::-webkit-slider-thumb:active {
    transform: scale(1.15);
    box-shadow: 0 0 0 6px rgba(0, 0, 0, 0.12);
  }

  /* Firefox */
  .range-input::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 9999px;
    background: #ed4c07;
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }

  .range-input::-moz-range-thumb:hover {
    transform: scale(1.1);
  }

  .range-input::-moz-range-thumb:active {
    transform: scale(1.15);
  }
`}</style>

    </div>
  );
};

export default Price;
