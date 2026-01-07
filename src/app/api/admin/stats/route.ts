// app/api/analytics/route.ts
export const runtime = "nodejs"; // ✅ Force Node runtime

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { adminDb } from "@/lib/firebase/admin";
import { hasPermission, UserRole } from "@/lib/rbac/roles";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/orderStatus";

export async function GET() {
  try {
    // Get session safely using getServerSession
    const session = await getServerSession(authOptions);
    const headersInstance = await headers();

    // Debug log session & headers
    console.log("Analytics API - Session check:", {
      hasSession: !!session,
      sessionUser: session?.user,
      cookies: headersInstance.get("cookie"),
      nodeEnv: process.env.NODE_ENV,
    });

    // Unauthorized check
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - No session found" },
        { status: 401 }
      );
    }

    const userRole = session.user.role as UserRole;

    // RBAC permission check
    if (!userRole || !hasPermission(userRole, "canViewAnalytics")) {
      return NextResponse.json(
        { error: "Forbidden - Insufficient permissions" },
        { status: 403 }
      );
    }

    // Fetch users, orders, and products concurrently
    const [usersSnap, ordersSnap, productsSnap] = await Promise.all([
      adminDb.collection("users").limit(5000).get(),
      adminDb.collection("orders").limit(5000).get(),
      adminDb.collection("products").limit(5000).get(),
    ]);

    // Map data
    const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const orders = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
    const products = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Debug log counts
    console.log("Fetched counts:", {
      users: users.length,
      orders: orders.length,
      products: products.length,
    });

    // Helper: check if order is paid
    const isPaid = (order: any) => [PAYMENT_STATUSES.PAID].includes(order.paymentStatus);

    // Calculate stats
    const totalRevenue = orders.filter(isPaid).reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const pendingOrders = orders.filter(o => o.status === ORDER_STATUSES.PENDING).length;
    const completedOrders = orders.filter(o => o.status === ORDER_STATUSES.COMPLETED && isPaid(o)).length;
    const cancelledOrders = orders.filter(o => o.status === ORDER_STATUSES.CANCELLED).length;

    const today = new Date().toISOString().split("T")[0];
    const todayRevenue = orders
      .filter(o => isPaid(o) && new Date(o.createdAt).toISOString().split("T")[0] === today)
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const stats = {
      totalUsers: users.length,
      totalOrders: orders.length,
      totalRevenue,
      todayRevenue,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      totalProducts: products.length,
    };

    // Debug log final stats
    console.log("Analytics API - Stats calculated:", stats);

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Analytics API - Error fetching stats:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
