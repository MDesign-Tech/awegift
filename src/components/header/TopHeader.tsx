"use client";
import { CiDeliveryTruck } from "react-icons/ci";
import { useState } from "react";
import Link from "next/link";
import Container from "../Container";
import CurrencyDropdown from "./CurrencyDropdown";
import DeliveryModal from "../DeliveryModal";

const TopHeader = ({
  freeShippingThreshold,
}: {
  freeShippingThreshold: string;
}) => {
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);

  return (
    <div className="bg-[#010f1c] text-gray-200 w-full">
      <Container className="flex relative z-100 items-center justify-between">
        <p
          className="hidden md:flex w-full md:w-auto text-sm items-center justify-center md:justify-normal font-medium py-1 cursor-pointer hover:text-orange-300 transition-colors duration-200"
          onClick={() => setIsDeliveryModalOpen(true)}
        >
          <CiDeliveryTruck className="text-[#ffb342] text-2xl mr-1" /> FREE
          Delivery On Orders {freeShippingThreshold} RWF+
        </p>
        <div className="w-full md:w-auto flex items-center justify-end md:justify-normal text-sm text-white gap-1">
          <Link
            href="/quote"
            className="headerTopMenu hidden md:block cursor-pointer hover:text-orange-300 transition-colors"
          >
            Request Quotation
          </Link>
          <CurrencyDropdown />
        </div>

        <DeliveryModal
          isOpen={isDeliveryModalOpen}
          onClose={() => setIsDeliveryModalOpen(false)}
          freeShippingThreshold={freeShippingThreshold}
        />
      </Container>
    </div>
  );
};

export default TopHeader;