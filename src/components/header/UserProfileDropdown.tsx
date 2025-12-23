"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import {
  FaUser,
  FaBox,
  FaHeart,
  FaCog,
  FaSignOutAlt,
  FaShieldAlt,
  FaBell,
} from "react-icons/fa";
import { signOut } from "next-auth/react";
import { getDefaultDashboardRoute, getRoleDisplayName } from "@/lib/rbac/roles";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useNotifications } from "@/lib/notification/provider";

interface UserProfileDropdownProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string | null;
  };
}

interface MenuItem {
  href: string;
  icon: any;
  label: string;
  badge: string | null;
}

const UserProfileDropdown = ({ user }: UserProfileDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { user: currentUser } = useCurrentUser();
  const { notifications } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200); // Small delay to prevent accidental closing
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Check if user has any admin role
  const isAdminUser = currentUser?.role && [
    "admin"
  ].includes(currentUser.role as any);

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const displayCount = unreadCount > 9 ? "9+" : unreadCount.toString();

  const menuItems: MenuItem[] = [
    {
      href: "/account",
      icon: FaUser,
      label: "My Profile",
      badge: null,
    },
    {
      href: "/account/orders",
      icon: FaBox,
      label: "My Orders",
      badge: null,
    },
    {
      href: "/account/notifications",
      icon: FaBell,
      label: "Notifications",
      badge: unreadCount > 0 ? displayCount : null,
    },
    {
      href: "/favorite",
      icon: FaHeart,
      label: "Wishlist",
      badge: null,
    },
    {
      href: "/account/settings",
      icon: FaCog,
      label: "Settings",
      badge: null,
    },
  ];

  // Add dashboard link for admin users
  const adminMenuItems: MenuItem[] = isAdminUser
    ? [
        {
          href: getDefaultDashboardRoute(currentUser.role as any || "user"),
          icon: FaShieldAlt,
          label: `${getRoleDisplayName(currentUser.role as any)} Dashboard`,
          badge: null,
        },
      ]
    : [];

  const allMenuItems: MenuItem[] = [...menuItems, ...adminMenuItems];

  return (
    <div
      ref={dropdownRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Profile Trigger */}
      <div
        onClick={toggleDropdown}
        className="flex items-center gap-2 cursor-pointer group"
      >
        <Link href="/account" className="flex items-center">
          <div className="border  border-gray-500 w-8 h-8 md:w-10 md:h-10 rounded-full text-xl overflow-hidden">
            {user?.image ? (
              <img
                src={user.image}
                alt={user?.name || "User"}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full  rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-lg font-semibold text-gray-600">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </span>
              </div>
            )}
          </div>
        </Link>
        <div
          onClick={(e) => {
            e.preventDefault();
            toggleDropdown();
          }}
          className="text-xs hidden md:block group-hover:text-sky-color cursor-pointer duration-300"
        >
          <p>Hello, {user?.name}</p>
          <p>view profile</p>
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full right-0 pt-1 w-48">
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-2 animate-in fade-in-0 zoom-in-95 duration-200">
            {/* User Info Header */}
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              {allMenuItems.map((item) => (
                <Link
                  key={item.href}
                  href={`${item.href}`}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors duration-200 ${
                    item.label.includes("Dashboard")
                      ? "text-red-600 hover:bg-red-50 hover:text-red-700 border-t border-gray-100 mt-1 pt-3"
                      : "text-gray-700 hover:bg-gray-50 hover:text-sky-color"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 my-1"></div>

            {/* Sign Out */}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
            >
              <FaSignOutAlt className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfileDropdown;