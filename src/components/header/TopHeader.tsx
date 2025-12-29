"use client";
import { CiDeliveryTruck } from "react-icons/ci";
import { useState } from "react";
import Link from "next/link";
import Container from "../Container";
import CurrencyDropdown from "./CurrencyDropdown";
// import SettingsDropdown from "./SettingsDropdown";

const TopHeader = ({
  freeShippingThreshold,
}: {
  freeShippingThreshold: string;
}) => {

  return (
    <div className="bg-[#010f1c] text-gray-200 w-full">
      <Container className="flex items-center justify-between">
        <p
          className="hidden md:flex w-full md:w-auto text-sm items-center justify-center md:justify-normal font-medium py-1 cursor-pointer hover:text-orange-300 transition-colors duration-200"
        >
          <CiDeliveryTruck className="text-[#ffb342] text-2xl mr-1" /> FREE Delivery
          On Orders {freeShippingThreshold} RWF+
        </p>
        <div className="w-full md:w-auto flex items-center justify-end md:justify-normal text-sm text-white gap-1">
          <Link
            href="/quote"
            className="headerTopMenu hidden md:block cursor-pointer hover:text-orange-300 transition-colors"
          >
            Request Quotation
          </Link>
          <CurrencyDropdown />
          {/* <div className="hidden md:block">
            <SettingsDropdown />
          </div> */}
        </div>
      </Container>
    </div>
  );
};

export default TopHeader;
