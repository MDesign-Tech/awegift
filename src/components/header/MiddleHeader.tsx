"use client";

import Container from "../Container";
import { LiaUser } from "react-icons/lia";
import { RiMenu3Fill } from "react-icons/ri";
import Link from "next/link";
import SearchInput from "./SearchInput";
import HeaderIcons from "./HeaderIcons";
import Logo from "../Logo";
import UserProfileDropdown from "./UserProfileDropdown";
import { Session } from "next-auth";
import { useState } from "react";
import MobileMenuPopup from "./MobileMenuPopup";

const MiddleHeader = ({ session }: { session: Session | null }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // If session exists but user data is missing or invalid, treat as unauthenticated
  const isAuthenticated = session?.user && session.user.email ? true : false;

  return (
    <div className="border-b border-b-gray-400 relative z-50">
      {/* Mobile Layout */}
      <div className="md:hidden">
        <Container className="py-5 flex items-center justify-center gap-4">
          <Logo />
          <SearchInput />
          <RiMenu3Fill
            className="text-2xl text-gray-500 hover:text-theme-color duration-200 cursor-pointer"
            onClick={() => setIsMobileMenuOpen(true)}
          />
        </Container>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block">
        <Container className="py-5 flex items-center justify-between gap-4 md:gap-6 lg:gap-20">
          <Logo />
          {/* Removed central SearchInput */}

          <div className="flex justify-end md:absolute md:left-1/2 md:-translate-x-1/2 md:justify-center w-full md:w-auto">
            <SearchInput />
          </div>

          <div className="flex items-center gap-5">
            {/* User */}
            {isAuthenticated && session?.user ? (
              <UserProfileDropdown user={session.user} />
            ) : (
              <div className="flex items-center gap-2 cursor-pointer">
                <div className="border-2 border-gray-700 p-1.5 rounded-full text-xl">
                  <LiaUser />
                </div>
                <div className="flex flex-col leading-tight">
                  <Link href={"/auth/signin"}>
                    <p className="text-xs hover:text-sky-color ease-in-out duration-300 cursor-pointer">
                      Guests
                    </p>
                  </Link>

                  <div className="text-sm flex items-center">
                    <Link
                      href={"/auth/signin"}
                      className="hover:text-sky-color ease-in-out duration-300 cursor-pointer"
                    >
                      Login
                    </Link>
                  </div>
                </div>
              </div>
            )}
            {/* Cart & Favorite Icons */}
            <HeaderIcons />
          </div>
        </Container>
      </div>

      {/* Mobile Menu Popup */}
      <MobileMenuPopup
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        session={session}
      />
    </div>
  );
};

export default MiddleHeader;