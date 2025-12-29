"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { IoChevronDownSharp } from "react-icons/io5";

export default function DashboardHeaderToggle() {
  const pathname = usePathname();
  const [headerVisible, setHeaderVisible] = useState(false);

  const isDashboard = pathname?.startsWith("/dashboard");

  // Hide header by default on dashboard pages
  useEffect(() => {
    if (isDashboard) {
      setHeaderVisible(false);
    } else {
      setHeaderVisible(true);
    }
  }, [isDashboard]);

  // Apply CSS class to hide/show header
  useEffect(() => {
    const header = document.querySelector('header');
    if (header) {
      // Add transition styles
      header.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease-in-out';

      if (isDashboard && !headerVisible) {
        // Hide with slide up animation but remove from document flow to eliminate whitespace
        header.style.position = 'absolute';
        header.style.transform = 'translateY(-100%)';
        header.style.opacity = '0';
        header.style.pointerEvents = 'none';
        header.style.zIndex = '40';
        // Remove click handler
        header.onclick = null;
      } else {
        // Show header - restore normal positioning
        header.style.position = 'sticky';
        header.style.transform = 'translateY(0)';
        header.style.opacity = '1';
        header.style.pointerEvents = 'auto';
        header.style.zIndex = '40';
        // Add click handler to hide header when clicked
        header.onclick = (e) => {
          const target = e.target as HTMLElement;
          // Only hide if clicking on the header background, not on interactive elements
          if (target === header || target?.tagName === 'HEADER') {
            setHeaderVisible(false);
          }
        };
      }
    }
  }, [isDashboard, headerVisible]);

  if (!isDashboard) return null;

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setHeaderVisible(!headerVisible);
      }}
      onMouseDown={(e) => e.preventDefault()}
      className="fixed top-4 right-4 z-50 bg-theme-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-accent-color"
      aria-label="Toggle header"
      type="button"
    >
      <motion.div
        animate={{ rotate: headerVisible ? 180 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <IoChevronDownSharp className="w-6 h-6 text-theme-color" />
      </motion.div>
    </button>
  );
}
