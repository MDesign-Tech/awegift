"use client";

import Container from "@/components/Container";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
interface TabItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  count?: number;
}

interface AccountLayoutProps {
  children: React.ReactNode;
}

export default function AccountLayout({ children }: AccountLayoutProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [orderCount, setOrderCount] = useState(0);

  // Check if user has any admin role using session role
  const userRole = session?.user?.role;
  const isAdmin = userRole && [
    "admin"
  ].includes(userRole as any);

  // Check if current path requires admin access
  const isAdminPath = pathname.startsWith("/dashboard");

  // Get role-specific information
  const getRoleInfo = () => {
    return {
      title: "My Account",
      description: "Manage your profile, addresses, orders, and account settings"
    };
  };

  const tabs: TabItem[] = [
    {
      id: "profile",
      label: "Profile",
      icon: "👤",
      path: "/account",
    },
    {
      id: "addresses",
      label: "Addresses",
      icon: "📍",
      path: "/account/addresses",
    },
    {
      id: "orders",
      label: "Orders",
      icon: "🛍️",
      path: "/account/orders",
      count: orderCount,
    },
    {
      id: "quotes",
      label: "Quotations",
      icon: "💬",
      path: "/account/quotes",
    },
    // {
    //   id: "payment",
    //   label: "Payment",
    //   icon: "💳",
    //   path: "/account/payment",
    // },
    {
      id: "notifications",
      label: "Notifications",
      icon: "🔔",
      path: "/account/notifications",
    },
    {
      id: "settings",
      label: "Settings",
      icon: "⚙️",
      path: "/account/settings",
    },
  ];

  // Fetch order count
  useEffect(() => {
    if (session?.user?.email) {
      fetchOrderCount();
    }
  }, [session?.user?.email]);

  const fetchOrderCount = async () => {
    try {
      const response = await fetch("/api/orders");
      const data = await response.json();
      if (data.orders && Array.isArray(data.orders)) {
        setOrderCount(data.orders.length);
      }
    } catch (err) {
      console.error("Error fetching order count:", err);
    }
  };

  // Handle access control after all hooks
  const roleInfo = getRoleInfo();
  const currentTabs = tabs;

  return (
    <Container className="py-4 md:py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {roleInfo.title}
          </h1>
          <p className="text-gray-600 mt-2">
            {roleInfo.description}
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="w-full mb-8">
          {/* Desktop Tabs */}
          <div className="hidden md:block border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {currentTabs.map((tab) => (
                <Link
                  key={tab.id}
                  href={tab.path}
                  className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    pathname === tab.path
                      ? "border-theme-color text-theme-color"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="ml-2 bg-theme-color text-white rounded-full px-2 py-1 text-xs">
                      {tab.count}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          </div>

          {/* Mobile Dropdown */}
          <div className="md:hidden">
            <label htmlFor="tab-select" className="sr-only">
              Select a section
            </label>
            <select
              id="tab-select"
              value={pathname}
              onChange={(e) => (window.location.href = e.target.value)}
              className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-theme-color focus:outline-none focus:ring-theme-color sm:text-sm"
            >
              {currentTabs.map((tab) => (
                <option key={tab.id} value={tab.path}>
                  {tab.icon} {tab.label}
                  {tab.count !== undefined &&
                    tab.count > 0 &&
                    ` (${tab.count})`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Page Content */}
        <div className="min-h-[400px]">{children}</div>
    </Container>
  );
}
