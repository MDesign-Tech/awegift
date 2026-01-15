"use client";

import Container from "../Container";
import Link from "next/link";
import { navigation } from "@/constants";
import { FaWhatsapp } from "react-icons/fa";
import { usePathname } from "next/navigation";

const BottomHeader = () => {
  const pathname = usePathname();

  return (
    <div className="border-b border-b-gray-400">
      <Container className="flex items-center justify-between py-2">
        <div className="text-[10px] md:text-xs font-medium flex items-center gap-5 uppercase">
          {navigation?.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item?.title}
                href={item?.href}
                className={`transition-colors duration-200 ${
                  isActive
                    ? "text-theme-color font-bold"
                    : "text-gray-700 hover:text-theme-color"
                }`}
              >
                {item?.title}
              </Link>
            );
          })}
        </div>
        <p className="text-sm text-gray-400 font-medium hidden md:inline-flex items-center gap-3">
          Tel: <span className="text-[#ed4c07]">+250 781 990 310</span>
          <span className="text-gray-400">|</span>
          <a
            href="https://wa.me/250781990310?text=Hello%20I%20would%20like%20to%20inquire%20about%20your%20products"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[#25D366] transition-colors duration-200"
          >
            <FaWhatsapp className="text-lg" />
            Whatsapp Us
          </a>
        </p>
      </Container>
    </div>
  );
};

export default BottomHeader;