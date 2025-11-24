"use client";

import Container from "@/components/Container";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { hasPermission, getRoleDisplayName } from "@/lib/rbac/roles";


interface TabItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  permission: string; // Permission required to access this tab
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const params = useParams();
  const role = params.role as string;
  const { user, isAdmin, userRole } = useCurrentUser();

  // Dashboard tabs based on permissions
  const getDashboardTabs = (userRole: string): TabItem[] => {
    const allTabs: TabItem[] = [
      {
        id: "overview",
        label: "Overview",
        icon: "📊",
        path: `/dashboard/${role}`,
        permission: "canAccessUserDashboard", // Base permission for dashboard access
      },
      {
        id: "products",
        label: "Products",
        icon: "📦",
        path: `/dashboard/${role}/products`,
        permission: "canViewProducts",
      },
      {
        id: "categories",
        label: "Categories",
        icon: "📂",
        path: `/dashboard/${role}/categories`,
        permission: "canViewProducts", // Assuming categories are part of product management
      },
      {
        id: "users",
        label: "Users",
        icon: "👥",
        path: `/dashboard/${role}/users`,
        permission: "canViewUsers",
      },
      {
        id: "orders",
        label: "Orders",
        icon: "🛒",
        path: `/dashboard/${role}/orders`,
        permission: "canViewOrders",
      },
      {
        id: "analytics",
        label: "Analytics",
        icon: "📈",
        path: `/dashboard/${role}/analytics`,
        permission: "canViewAnalytics",
      },
    ];

    return allTabs.filter(tab => hasPermission(userRole, tab.permission as any));
  };

  const tabs = getDashboardTabs(userRole);

  const getRoleInfo = (role: string) => {
    switch (role) {
      case "admin":
        return {
          title: `${getRoleDisplayName(role)} Dashboard`,
          description: "Manage users, orders, analytics, and system settings"
        };
      case "deliveryman":
        return {
          title: `${getRoleDisplayName(role)} Dashboard`,
          description: "Handle shipping, delivery tracking, and logistics management"
        };
      case "packer":
        return {
          title: `${getRoleDisplayName(role)} Dashboard`,
          description: "Manage order fulfillment, packing, and inventory tracking"
        };
      case "accountant":
        return {
          title: `${getRoleDisplayName(role)} Dashboard`,
          description: "Handle financial management, payments, and accounting reports"
        };
      default:
        return {
          title: "Dashboard",
          description: "Your dashboard overview"
        };
    }
  };

  const roleInfo = getRoleInfo(userRole);

  return (
    <Container className="py-10">
      <div className="max-w-6xl mx-auto">
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
              {tabs.map((tab) => (
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
              {tabs.map((tab) => (
                <option key={tab.id} value={tab.path}>
                  {tab.icon} {tab.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Page Content */}
        <div className="min-h-[400px]">{children}</div>
      </div>
    </Container>
  );
}