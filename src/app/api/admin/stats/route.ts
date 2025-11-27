import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { hasPermission, UserRole } from "@/lib/rbac/roles";
import { getToken } from "next-auth/jwt";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/orderStatus";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userDoc = await getDoc(doc(db, "users", token.sub));
    if (!userDoc.exists()) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const userRole = (userDoc.data()?.role as UserRole) || "user";
    if (!hasPermission(userRole, "canViewAnalytics"))
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });

    const [usersSnap, ordersSnap, productsSnap] = await Promise.all([
      getDocs(collection(db, "users")),
      getDocs(collection(db, "orders")),
      getDocs(collection(db, "products")),
    ]);

    const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const orders = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
    const products = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Helper to check if order is "paid"
    const isPaid = (order: any) =>
      [PAYMENT_STATUSES.PAID].includes(order.paymentStatus);

    // Total Revenue
    const totalRevenue = orders
      .filter(isPaid)
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    // Pending Orders
    const pendingOrders = orders.filter(o => o.status === ORDER_STATUSES.PENDING).length;

    // Completed Orders (DELIVERED + paid)
    const completedOrders = orders.filter(
      o => o.status === ORDER_STATUSES.DELIVERED && isPaid(o)
    ).length;

    // Cancelled Orders
    const cancelledOrders = orders.filter(o => o.status === ORDER_STATUSES.CANCELLED).length;

    // Today's Revenue
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

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
