"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FiUsers,
  FiShoppingBag,
  FiDollarSign,
  FiPackage,
  FiTrendingUp,
  FiClock,
} from "react-icons/fi";
import { StatsSkeleton, DashboardCardSkeleton } from "./Skeletons";
import { hasPermission, getDefaultDashboardRoute } from "@/lib/rbac/roles";
import { useUserSync } from "@/hooks/useUserSync";
import PriceFormat from "@/components/PriceFormat";
import AccessDenied from "./AccessDenied";

interface Stats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  pendingOrders: number;
  completedOrders: number;
}

export default function DashboardOverviewClient() {
  const { data: session } = useSession();
  const router = useRouter();
  const { user, isLoading: userLoading } = useUserSync();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const userRole = user?.role || "user";

  useEffect(() => {
    if (userRole && !userLoading) {
      fetchStats();
    }
  }, [userRole, userLoading]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/stats");
      if (response.ok) {
        const data = await response.json();

        // Check for unauthorized error
        if (data.error === "Unauthorized") {
          router.push("/auth/signin");
          return;
        }

        // Ensure numeric values are properly converted
        // Example normalization
        const normalizedStats = {
          ...data,
          totalRevenue: Number(data.totalRevenue) || 0,
          todayRevenue: Number(data.todayRevenue) || 0,
          totalOrders: Number(data.totalOrders) || 0,
          completedOrders: Number(data.completedOrders) || 0,
          pendingOrders: Number(data.pendingOrders) || 0,
          totalUsers: Number(data.totalUsers) || 0,
          totalProducts: Number(data.totalProducts) || 0,
        };

        setStats(normalizedStats);
      }
    } catch (error) {
      console.error("Error fetching admin stats:", error);
    } finally {
      setLoading(false);
    }
  };

  // Check if user has permission to view overview data
  const canViewOverview = userRole && hasPermission(userRole as any, "canViewOverview");

  if (loading) {
    return (
      <div className="space-y-8">
        <StatsSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DashboardCardSkeleton />
          <DashboardCardSkeleton />
        </div>
      </div>
    );
  }

  // Show access denied message for roles without overview permissions
  if (!canViewOverview) {
    return <AccessDenied />;
  }

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Users - Only for admin and accountant */}
        {userRole && hasPermission(userRole as any, "canViewUsers") && (
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
              <FiUsers className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {stats?.totalUsers || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Registered users</p>
          </div>
        )}

        {/* Total Orders - For all roles that can view orders */}
        {userRole && hasPermission(userRole as any, "canViewOrders") && (
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
              <FiShoppingBag className="h-6 w-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {stats?.totalOrders || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">All time orders</p>
          </div>
        )}

        {/* Total Revenue - Only for admin, accountant */}
        {userRole && hasPermission(userRole as any, "canViewFinancials") && (
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
              <FiDollarSign className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              <PriceFormat amount={stats?.totalRevenue || 0} />
            </div>
            <p className="text-xs text-gray-500 mt-1">Total earnings</p>
          </div>
        )}

        {/* Total Products - For all roles that can view products */}
        {userRole && hasPermission(userRole as any, "canViewProducts") && (
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">
                Total Products
              </h3>
              <FiPackage className="h-6 w-6 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {stats?.totalProducts}
            </div>
            <p className="text-xs text-gray-500 mt-1">Available products</p>
          </div>
        )}

        {/* Pending Orders - For roles that can view orders */}
        {userRole && hasPermission(userRole as any, "canViewOrders") && (
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">
                Pending Orders
              </h3>
              <FiClock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {stats?.pendingOrders || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Awaiting processing</p>
          </div>
        )}

        {/* Completed Orders - For roles that can view orders */}
        {userRole && hasPermission(userRole as any, "canViewOrders") && (
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">
                Completed Orders
              </h3>
              <FiTrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {stats?.completedOrders || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Successfully fulfilled</p>
          </div>
        )}
      </div>
    </div>
  );
}
