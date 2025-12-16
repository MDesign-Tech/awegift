"use client";
import { useState } from "react";
import { FaFilter, FaSort } from "react-icons/fa";
import { HiViewGrid, HiViewList } from "react-icons/hi";

interface Props {
  totalProducts: number;
  currentPage: number;
  itemsPerPage: number;
  onViewChange: (view: "grid" | "list") => void;
  onSortChange: (sort: string) => void;
  onItemsPerPageChange: (items: number) => void;
  onToggleMobileFilters: () => void;
  currentView: "grid" | "list";
  currentSort: string;
}

const ProductsHeader = ({
  onViewChange,
  onSortChange,
  onToggleMobileFilters,
  currentView,
  currentSort,
}: Props) => {

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

        <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
          {/* Mobile Filter Button */}
          <button
            onClick={onToggleMobileFilters}
            className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <FaFilter className="w-4 h-4" />
            Filters
          </button>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <FaSort className="w-4 h-4 text-gray-400" />
            <select
              value={currentSort}
              onChange={(e) => onSortChange(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="default">Sort by</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">Newest First</option>
              <option value="name-az">Name: A to Z</option>
              <option value="name-za">Name: Z to A</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
            <button
              onClick={() => onViewChange("grid")}
              className={`p-2 ${
                currentView === "grid"
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              } transition-colors`}
            >
              <HiViewGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewChange("list")}
              className={`p-2 ${
                currentView === "list"
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              } transition-colors`}
            >
              <HiViewList className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsHeader;
