"use client";

import { usePathname, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { UserRole, hasPermission } from "@/lib/rbac/roles";
import { fetchUserFromFirestore } from "@/lib/firebase/userService";
import { FirestoreUser } from "@/lib/firebase/userService";

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
  const { data: session } = useSession();
  const [userRole, setUserRole] = useState<string>("user");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (session?.user?.id) {
        try {
          const user = await fetchUserFromFirestore(session.user.id);
          if (user) {
            setUserRole(user.role || "user");
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
        }
      }
      setLoading(false);
    };

    fetchUserRole();
  }, [session?.user?.id]);

  // Dashboard tabs based on permissions
  const getDashboardTabs = (userRole: string): TabItem[] => {
    const allTabs: TabItem[] = [
      {
        id: "overview",
        label: "Overview",
        icon: "📊",
        path: `/dashboard/${role}`,
        permission: "canViewOrders", // Base permission for dashboard access
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

    return allTabs.filter(tab => hasPermission(userRole as UserRole, tab.permission as keyof typeof hasPermission));
  };

  const tabs = getDashboardTabs(userRole);

  if (loading) {
    return (
      <div className="w-full mb-8">
        <div className="animate-pulse">
          <div className="hidden md:block border-b border-gray-200">
            <div className="flex space-x-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-8 bg-gray-200 rounded w-20"></div>
              ))}
            </div>
          </div>
          <div className="md:hidden">
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
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
  );
}