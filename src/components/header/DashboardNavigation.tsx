"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { USER_ROLES, getDashboardRoute } from "@/lib/rbac/permissions";

export default function DashboardNavigation() {
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  if (!session?.user || !userRole) {
    return null;
  }

  const dashboardRoute = getDashboardRoute(userRole as any);

  const getDashboardLabel = (role: string) => {
    switch (role) {
      case USER_ROLES.ADMIN:
        return "Admin Dashboard";
      case USER_ROLES.ACCOUNT:
        return "Accounting Dashboard";
      case USER_ROLES.PACKER:
        return "Packer Dashboard";
      case USER_ROLES.DELIVERYMAN:
        return "Delivery Dashboard";
      case USER_ROLES.USER:
      default:
        return "My Account";
    }
  };

  const getDashboardIcon = (role: string) => {
    switch (role) {
      case USER_ROLES.ADMIN:
        return "⚙️";
      case USER_ROLES.ACCOUNT:
        return "💰";
      case USER_ROLES.PACKER:
        return "📦";
      case USER_ROLES.DELIVERYMAN:
        return "🚚";
      case USER_ROLES.USER:
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