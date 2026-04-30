"use client";

import Container from "../Container";
import Link from "next/link";
import { FaWhatsapp } from "react-icons/fa";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface CategoryItem {
  id?: string;
  name: string;
  slug: string;
  image?: string;
}

const bottomLinks = [
  { title: "Home", href: "/" },
  { title: "Products", href: "/products" },
  { title: "Our Services", href: "/m" },
];

const BottomHeader = () => {
  const pathname = usePathname();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data)) {
          setCategories(data);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setIsDropdownOpen(false);
  }, [pathname]);

  return (
    <div className="border-b border-b-gray-400">
      <Container className="flex items-center justify-between py-2">
        <div className="text-[10px] md:text-xs font-medium flex items-center gap-5 uppercase">
          <div ref={dropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="flex items-center gap-1 text-gray-700 hover:text-theme-color transition-colors duration-200"
              aria-expanded={isDropdownOpen}
            >
              CATEGORIES
              <span className="inline-block h-2.5 w-2.5 border-b border-r border-current rotate-45" />
            </button>

            {isDropdownOpen && (
              <div className="absolute left-0 top-full z-50 mt-2 w-80 min-w-[18rem] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
                <Link
                  href="/categories"
                  className="block px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  All categories
                </Link>
                <div className="border-t border-gray-200" />
                <div className="max-h-72 overflow-y-auto">
                  {categories.length > 0 ? (
                    categories.map((category) => (
                      <Link
                        key={category.slug}
                        href={`/products?category=${category.slug}`}
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                          {category.image ? (
                            <img
                              src={category.image}
                              alt={category.name}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-gray-500">
                              No image
                            </div>
                          )}
                        </div>
                        <span>{category.name}</span>
                      </Link>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      No categories available.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {bottomLinks.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.title}
                href={item.href}
                className={`transition-colors duration-200 ${
                  isActive
                    ? "text-theme-color font-bold"
                    : "text-gray-700 hover:text-theme-color"
                }`}
              >
                {item.title}
              </Link>
            );
          })}
        </div>

        <a
          href="https://wa.me/250781990310?text=Hello%20I%20would%20like%20to%20inquire%20about%20your%20products"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[#25D366] text-sm font-medium transition-colors duration-200"
        >
          <FaWhatsapp className="text-lg" />
          Get in touch
        </a>
      </Container>
    </div>
  );
};

export default BottomHeader;
