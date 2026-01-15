"use client";

import { Dialog, DialogPanel } from "@headlessui/react";
import Link from "next/link";
import { MdClose, MdFavoriteBorder } from "react-icons/md";
import { BiShoppingBag } from "react-icons/bi";
import { LiaUser } from "react-icons/lia";
import { RiSearchLine } from "react-icons/ri";
import { Session } from "next-auth";
import { useSelector } from "react-redux";
import { StateType } from "../../../type";

interface MobileMenuPopupProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session | null;
}

const MobileMenuPopup = ({ isOpen, onClose, session }: MobileMenuPopupProps) => {
  const { cart, favorite } = useSelector((state: StateType) => state?.aweGift);
  const isAuthenticated = session?.user && session.user.email ? true : false;

  const menuItems = [
    { title: "Our Services", href: "/services", icon: null },
    { title: "About Us", href: "/about", icon: null },
  ];

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-[60] md:hidden"
    >
      {/* Blur overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Centered popup */}
      <div className="fixed inset-0 flex items-start justify-center p-4">
        <DialogPanel className="w-full max-w-sm bg-white rounded-lg shadow-xl p-6 space-y-6">
          {/* Close button */}
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              <MdClose />
            </button>
          </div>

          {/* Icons section */}
          <div className="flex justify-center gap-6">

            {/* Cart */}
            <Link href="/cart" onClick={onClose} className="flex flex-col items-center gap-2 relative">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl relative">
                <BiShoppingBag />
                {cart?.length > 0 && (
                  <span className="absolute -top-1 -right-1 text-[10px] font-medium w-4 h-4 bg-[#ed4c07] text-white rounded-full flex items-center justify-center">
                    {cart?.length}
                  </span>
                )}
              </div>
              <span className="text-xs text-black">Cart</span>
            </Link>

            {/* Favorite */}
            <Link href="/favorite" onClick={onClose} className="flex flex-col items-center gap-2 relative">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl relative">
                <MdFavoriteBorder />
                {favorite?.length > 0 && (
                  <span className="absolute -top-1 -right-1 text-[10px] font-medium w-4 h-4 bg-[#ed4c07] text-white rounded-full flex items-center justify-center">
                    {favorite?.length}
                  </span>
                )}
              </div>
              <span className="text-xs text-black">Favorite</span>
            </Link>

            {/* Profile */}
            {isAuthenticated ? (
              <Link href="/account" onClick={onClose} className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl">
                  <LiaUser />
                </div>
                <span className="text-xs text-black">Profile</span>
              </Link>
            ) : (
              <Link href="/auth/signin" onClick={onClose} className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl">
                  <LiaUser />
                </div>
                <span className="text-xs text-black">Login</span>
              </Link>
            )}
          </div>

          {/* Menu items */}
          <div className="border-t pt-6">
            <div className="space-y-4">
              {menuItems.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  onClick={onClose}
                  className="block text-gray-700 hover:text-theme-color transition-colors duration-200 py-2"
                >
                  {item.title}
                </Link>
              ))}
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};

export default MobileMenuPopup;