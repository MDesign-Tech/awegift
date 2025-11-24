import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, query, where } from "firebase/firestore";
import { hasPermission } from "@/lib/rbac/roles";
import { getToken } from "next-auth/jwt";

export async function GET(request: NextRequest) {
  try {
    // Check authentication and permissions
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = token.role as any;
    if (!hasPermission(userRole, "canViewAnalytics")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Fetch real data from Firebase
    const [usersSnapshot, ordersSnapshot, productsSnapshot] = await Promise.all([
      getDocs(collection(db, "users")),
      getDocs(collection(db, "orders")),
      getDocs(collection(db, "products")),
    ]);

    const users = usersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    const orders = ordersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as any[];

    const products = productsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Calculate real stats
    const totalRevenue = orders.reduce(
      (sum, order) => sum + (order.total || 0),
      0
    );
    const pendingOrders = orders.filter(
      (order) => order.status === "pending"
    ).length;
    const completedOrders = orders.filter(
      (order) => order.status === "completed"
    ).length;

    const stats = {
      totalUsers: users.length,
      totalOrders: orders.length,
      totalRevenue: totalRevenue,
      totalProducts: products.length,
      pendingOrders: pendingOrders,
      completedOrders: completedOrders,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
