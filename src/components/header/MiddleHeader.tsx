"use client";

import Container from "../Container";
import { LiaUser } from "react-icons/lia";
import Link from "next/link";
import SearchInput from "./SearchInput";
import { useAuth } from "@/lib/auth/AuthContext";
import HeaderIcons from "./HeaderIcons";
import Logo from "../Logo";
import UserProfileDropdown from "./UserProfileDropdown";

const MiddleHeader = () => {
  const { user } = useAuth();

  return (
    <div className="border-b border-b-gray-400 relative z-50">
      <Container className="py-5 flex items-center justify-between gap-4 md:gap-6 lg:gap-20">
        <Logo />
        {/* Removed central SearchInput */}

        <div className="flex justify-end md:absolute md:left-1/2 md:-translate-x-1/2 md:justify-center w-full md:w-auto">
          <SearchInput />
        </div>

        <div className="flex items-center gap-5">
          {/* Search Icon Trigger */}
          {/* <SearchInput /> */}

          {/* User */}
          {user ? (
            <UserProfileDropdown user={user} />
          ) : (
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="border-2 border-gray-700 p-1.5 rounded-full text-xl">
                <LiaUser />
              </div>
              <div className="hidden md:block">
                <Link href={"/auth/signin"}>
                  <p className="text-xs hover:text-sky-color ease-in-out duration-300 cursor-pointer">
                    Hello, Guests
                  </p>
                </Link>

                <div className="text-sm">
                  <Link
                    href={"/auth/signin"}
                    className="hover:text-sky-color ease-in-out duration-300 cursor-pointer"
                  >
                    Login{" "}
                  </Link>
                  /{" "}
                  <Link
                    href={"/auth/register"}
                    className="hover:text-sky-color ease-in-out duration-300 cursor-pointer"
                  >
                    Register
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
  );
};

export default MiddleHeader;
