import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, query, where } from "firebase/firestore";

export async function GET() {
  try {
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
