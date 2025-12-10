import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { hasPermission, UserRole } from "@/lib/rbac/roles";
import { getToken } from "next-auth/jwt";

export async function GET(request: NextRequest) {
  try {
    // Check authentication and permissions
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = token.role as UserRole;
    if (!hasPermission(userRole, "canViewAnalytics")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Fetch all orders from orders collection (primary source)
    const ordersRef = collection(db, "orders");
    const ordersSnapshot = await getDocs(ordersRef);

    const rawOrders = ordersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })).slice(0, 100); // Limit to 100 for analytics

    // Normalize orders data
    const orders = rawOrders.map((data: any) => {
      // Parse createdAt string to Date object
      let createdAt: Date;
      if (data.createdAt && typeof data.createdAt === 'string') {
        // Handle format like "17 November 2025 at 22:58:01 UTC-10"
        try {
          // Parse the date string manually
          const parts = data.createdAt.split(' ');
          if (parts.length >= 6) {
            const day = parseInt(parts[0]);
            const month = parts[1];
            const year = parseInt(parts[2]);
            const time = parts[4];
            const timezone = parts[5];

            // Convert month name to number
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                              'July', 'August', 'September', 'October', 'November', 'December'];
            const monthIndex = monthNames.indexOf(month);

            if (monthIndex !== -1) {
              createdAt = new Date(year, monthIndex, day);
              // Add time if available
              if (time) {
                const timeParts = time.split(':');
                if (timeParts.length >= 2) {
                  createdAt.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]));
                  if (timeParts.length >= 3) {
                    createdAt.setSeconds(parseInt(timeParts[2]));
                  }
                }
              }
            } else {
              createdAt = new Date(); // fallback
            }
          } else {
            createdAt = new Date(data.createdAt);
          }

          // Check if date is valid
          if (isNaN(createdAt.getTime())) {
            createdAt = new Date(); // fallback to current date
          }
        } catch (error) {
          createdAt = new Date(); // fallback to current date
        }
      } else if (data.createdAt instanceof Date) {
        createdAt = data.createdAt;
      } else {
        createdAt = new Date();
      }

      return {
        id: data.id,
        orderId: data.orderId || data.id,
        createdAt,
        total: parseFloat(data.total || "0"),
        status: data.status || "pending",
        items: data.items || [],
        email: data.email || data.userEmail || "",
        paymentMethod: data.paymentMethod || "",
        paymentStatus: data.paymentStatus || "",
        deliveryAddress: data.orderAddress || data.shippingAddress || {},
        statusHistory: data.statusHistory || [],
      };
    });

    // Calculate analytics data
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Monthly revenue data for the past 12 months
    const monthlyRevenue = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(currentYear, currentMonth - index, 1);
      const monthOrders = orders.filter((order: any) => {
        const orderDate = new Date(order.createdAt);
        return (
          orderDate.getMonth() === date.getMonth() &&
          orderDate.getFullYear() === date.getFullYear()
        );
      });

      const revenue = monthOrders.reduce(
        (sum: number, order: any) => sum + (order.total),
        0
      );

      return {
        month: date.toLocaleDateString("en-US", {
          month: "short",
          year: "2-digit",
        }),
        revenue: Math.round(revenue),
        orders: monthOrders.length,
      };
    }).reverse();

    // Order status distribution
    const statusDistribution = orders.reduce(
      (acc: Record<string, number>, order: any) => {
        const status = order.status || "pending";
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      {}
    );

    // Recent activity (last 10 orders)
    const recentActivity = orders.slice(0, 10).map((order: any) => ({
      id: order.id,
      type: "order",
      description: `Order #${order.orderId.slice(0, 8)} - ${order.status}`,
      amount: order.total || 0,
      timestamp: order.createdAt,
      status: order.status || "pending",
    }));

    // Calculate totals
    const totalRevenue = orders.reduce(
      (sum: number, order: any) => sum + (order.total || 0),
      0
    );
    const totalOrders = orders.length;

    // This month's data
    const thisMonthOrders = orders.filter((order: any) => {
      const orderDate = new Date(order.createdAt);
      return (
        orderDate.getMonth() === currentMonth &&
        orderDate.getFullYear() === currentYear
      );
    });
    const thisMonthRevenue = thisMonthOrders.reduce(
      (sum: number, order: any) => sum + (order.total || 0),
      0
    );

    // Growth calculations (comparing to last month)
    const lastMonthOrders = orders.filter((order: any) => {
      const orderDate = new Date(order.createdAt);
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const year = currentMonth === 0 ? currentYear - 1 : currentYear;
      return (
        orderDate.getMonth() === lastMonth && orderDate.getFullYear() === year
      );
    });
    const lastMonthRevenue = lastMonthOrders.reduce(
      (sum: number, order: any) => sum + (order.total || 0),
      0
    );

    const revenueGrowth =
      lastMonthRevenue > 0
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
        : 0;
    const orderGrowth =
      lastMonthOrders.length > 0
        ? ((thisMonthOrders.length - lastMonthOrders.length) /
            lastMonthOrders.length) *
          100
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalRevenue: Math.round(totalRevenue),
          totalOrders,
          monthlyRevenue: Math.round(thisMonthRevenue),
          monthlyOrders: thisMonthOrders.length,
          revenueGrowth: Math.round(revenueGrowth * 100) / 100,
          orderGrowth: Math.round(orderGrowth * 100) / 100,
        },
        monthlyRevenue,
        statusDistribution: Object.entries(statusDistribution).map(
          ([status, count]) => ({
            status,
            count: count as number,
            percentage: Math.round(((count as number) / totalOrders) * 100),
          })
        ),
        recentActivity,
      },
    });
  } catch (error) {
    console.error("Analytics API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 }
    );
  }
}
