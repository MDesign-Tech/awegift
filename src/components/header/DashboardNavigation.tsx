"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { getDefaultDashboardRoute, getRoleDisplayName } from "@/lib/rbac/roles";

export default function DashboardNavigation() {
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  if (!session?.user || !userRole) {
    return null;
  }

  const dashboardRoute = getDefaultDashboardRoute(userRole as any);

  const getDashboardLabel = (role: string) => {
    switch (role) {
      case "admin":
      case "accountant":
      case "packer":
      case "deliveryman":
        return `${getRoleDisplayName(role)} Dashboard`;
      case "user":
      default:
        return "My Account";
    }
  };

  const getDashboardIcon = (role: string) => {
    switch (role) {
      case "admin":
        return "⚙️";
      case "accountant":
        return "💰";
      case "packer":
        return "📦";
      case "deliveryman":
        return "🚚";
      case "user":
      default:
        return "👤";
    }
  };

  return (
    <div className="flex items-center space-x-4">
      <Link
        href={dashboardRoute}
        className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
      >
        <span className="text-lg">{getDashboardIcon(userRole)}</span>
        <span className="hidden sm:inline">{getDashboardLabel(userRole)}</span>
      </Link>

      {/* Profile Link for all users */}
      <Link
        href="/account"
        className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
      >
        <span className="text-lg">👤</span>
        <span className="hidden sm:inline">My Profile</span>
      </Link>
    </div>
  );
}