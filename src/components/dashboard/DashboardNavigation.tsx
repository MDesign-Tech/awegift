"use client";

import { usePathname, useParams } from "next/navigation";
import Link from "next/link";
import { UserRole, hasPermission } from "@/lib/rbac/roles";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface TabItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  permission: string; // Permission required to access this tab
}

export default function DashboardNavigation() {
  const pathname = usePathname();
  const params = useParams();
  const role = params.role as string;
  const { userRole } = useCurrentUser();

  // Dashboard tabs based on permissions
  const getDashboardTabs = (userRole: string): TabItem[] => {
    const basePath = "/dashboard"

    const allTabs: TabItem[] = [
      {
        id: "overview",
        label: "Overview",
        icon: "📊",
        path: basePath,
        permission: "canViewOverview",
      },
      {
        id: "products",
        label: "Products",
        icon: "📦",
        path: `${basePath}/products`,
        permission: "canViewProducts",
      },
      {
        id: "categories",
        label: "Categories",
        icon: "📂",
        path: `${basePath}/categories`,
        permission: "canViewProducts",
      },
      {
        id: "users",
        label: "Users",
        icon: "👥",
        path: `${basePath}/users`,
        permission: "canViewUsers",
      },
      {
        id: "orders",
        label: "Orders",
        icon: "🛒",
        path: `${basePath}/orders`,
        permission: "canViewOrders",
      },
      {
        id: "quotes",
        label: "Quotes",
        icon: "💬",
        path: `${basePath}/quotes`,
        permission: "canViewQuotes",
      },
      {
        id: "notifications",
        label: "Notifications",
        icon: "🔔",
        path: `${basePath}/notifications`,
        permission: "canManageQuotes",
      },
      {
        id: "analytics",
        label: "Analytics",
        icon: "📈",
        path: `${basePath}/analytics`,
        permission: "canViewAnalytics",
      },
    ];

    return allTabs.filter(tab => hasPermission(userRole as UserRole, tab.permission as any));
  };

  const tabs = getDashboardTabs(userRole);

  return (
    <div className="w-full mb-8">
      {/* Desktop Tabs */}
      <div className="hidden lg:block border-b border-gray-200">
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
      <div className="lg:hidden">
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
  );
}