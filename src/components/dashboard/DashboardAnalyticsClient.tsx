"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { StatsSkeleton, DashboardCardSkeleton } from "./Skeletons";
import { UserRole, hasPermission, getRoleBadgeColor, getRoleDisplayName } from "@/lib/rbac/roles";
import { useUserSync } from "@/hooks/useUserSync";
import AccessDenied from "./AccessDenied";
import {
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiShoppingCart,
  FiUsers,
  FiPackage,
  FiCalendar,
  FiBarChart,
} from "react-icons/fi";

interface AnalyticsData {
  success: boolean;
  data: {
    overview: {
      totalRevenue: number;
      totalOrders: number;
      monthlyRevenue: number;
      monthlyOrders: number;
      revenueGrowth: number;
      orderGrowth: number;
    };
    monthlyRevenue: Array<{ month: string; revenue: number; orders: number }>;
    statusDistribution: Array<{ status: string; count: number; percentage: number }>;
    recentActivity: Array<{
      id: string;
      type: string;
      description: string;
      amount: number;
      timestamp: any;
      status: string;
    }>;
  };
}

export default function DashboardAnalyticsClient() {
  const { data: session } = useSession();
  const { user, isLoading: userLoading } = useUserSync();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const userRole = user?.role;
  const userProfile = user;

  // Check if user has permission to view analytics
  const canViewAnalytics = hasPermission(userRole as UserRole, "canViewAnalytics");

    const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/stats");
      console.log("Analytics response ", response);
      if (response.ok) {
        const data = await response.json();
        // Transform stats data to match expected analytics format
        const transformedData = {
          success: true,
          data: {
            overview: {
              totalRevenue: data.totalRevenue || 0,
              totalOrders: data.totalOrders || 0,
              monthlyRevenue: data.totalRevenue || 0, // Placeholder
              monthlyOrders: data.totalOrders || 0, // Placeholder
              revenueGrowth: 0, // Placeholder
              orderGrowth: 0, // Placeholder
            },
            monthlyRevenue: [], // Placeholder
            statusDistribution: [], // Placeholder
            recentActivity: [], // Placeholder
          }
        };
        setAnalytics(transformedData);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Handle access denied after all hooks
  if (!canViewAnalytics) {
    return <AccessDenied message="You don't have permission to view analytics data." />;
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <StatsSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DashboardCardSkeleton />
          <DashboardCardSkeleton />
        </div>
        <DashboardCardSkeleton />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <FiBarChart className="mx-auto h-12 w-12 text-gray-400" />
        <p className="text-gray-500 mt-4">Unable to load analytics data</p>
      </div>
    );
  }

  // Get role-specific colors
  const roleColors = getRoleBadgeColor(userRole as any);
  const colorClasses = roleColors.split(' ');
  const bgColorClass = colorClasses.find(c => c.startsWith('bg-')) || 'bg-gray-100';
  const textColorClass = colorClasses.find(c => c.startsWith('text-')) || 'text-gray-800';

  const stats = [
    {
      title: "Total Revenue",
      value: `$${analytics.data.overview.totalRevenue.toFixed(2)}`,
      change: analytics.data.overview.revenueGrowth,
      icon: FiDollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: userProfile ? `${getRoleDisplayName(userProfile.role as UserRole)} Orders` : "My Orders",
      value: analytics?.data.overview.totalOrders?.toString() || "0",
      change: analytics.data.overview.orderGrowth,
      icon: FiShoppingCart,
      color: textColorClass,
      bgColor: bgColorClass,
    },
    {
      title: "Monthly Revenue",
      value: `$${analytics.data.overview.monthlyRevenue.toFixed(2)}`,
      change: 0,
      icon: FiUsers,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Monthly Orders",
      value: analytics.data.overview.monthlyOrders.toString(),
      change: 0,
      icon: FiPackage,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Admin Profile Header */}
      {userProfile && (
        <div className={`bg-gradient-to-r ${bgColorClass.replace('bg-', 'from-').replace('-100', '-50')} to-white p-6 rounded-lg shadow border border-gray-200`}>
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className={`h-16 w-16 rounded-full ${bgColorClass} flex items-center justify-center shadow-lg`}>
                <span className={`text-2xl font-bold ${textColorClass}`}>
                  {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : userProfile.email?.charAt(0).toUpperCase() || 'A'}
                </span>
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">
                {getRoleDisplayName(userProfile.role as UserRole)} Analytics
              </h2>
              <p className="text-gray-600">
                Welcome back, {userProfile.name || userProfile.email}!
              </p>
              <div className="flex items-center mt-2">
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${roleColors}`}>
                  {getRoleDisplayName(userProfile.role as UserRole)}
                </span>
                <span className="ml-3 text-sm text-gray-500">
                  Member since {userProfile.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {stat.title}
                </p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {stat.value}
                </p>
                {stat.change !== 0 && (
                  <div className="flex items-center mt-2">
                    {stat.change > 0 ? (
                      <FiTrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <FiTrendingDown className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        stat.change > 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {stat.change > 0 ? "+" : ""}
                      {stat.change.toFixed(1)}%
                    </span>
                    <span className="text-sm text-gray-500 ml-1">
                      from last month
                    </span>
                  </div>
                )}
              </div>
              <div className={`p-3 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Monthly Revenue
            </h3>
            <FiCalendar className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {analytics.data.monthlyRevenue.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{item.month}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          (item.revenue /
                            Math.max(
                              ...analytics.data.monthlyRevenue.map((r) => r.revenue)
                            )) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-16 text-right">
                    ${item.revenue.toFixed(0)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Status Distribution */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Orders by Status
            </h3>
            <FiBarChart className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {analytics.data.statusDistribution.map((item, index) => {
              const colors = [
                "bg-yellow-500",
                "bg-blue-500",
                "bg-indigo-500",
                "bg-green-500",
                "bg-red-500",
              ];
              return (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        colors[index % colors.length]
                      }`}
                    />
                    <span className="text-sm text-gray-600 capitalize">
                      {item.status}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">
                      {item.count}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({item.percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {analytics.data.recentActivity.map((activity, index) => (
            <div key={index} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <FiShoppingCart className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    ${activity.amount.toFixed(2)}
                  </p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    activity.status === 'completed' ? 'bg-green-100 text-green-800' :
                    activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {activity.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        {analytics.data.recentActivity.length === 0 && (
          <div className="px-6 py-12 text-center">
            <FiPackage className="mx-auto h-12 w-12 text-gray-400" />
            <p className="text-gray-500 mt-4">No recent activity</p>
          </div>
        )}
      </div>
    </div>
  );
}
