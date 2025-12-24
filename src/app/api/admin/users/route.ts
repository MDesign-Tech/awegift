import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { UserRole } from "@/lib/rbac/roles";
import { requireRole } from "@/lib/server/auth-utils";

// GET → fetch all users
export async function GET(request: NextRequest) {
  const check = await requireRole(request, "canViewUsers");
  if (check instanceof NextResponse) return check; // permission denied

  // ✅ Now safe to fetch users
  const usersSnapshot = await adminDb.collection("users").get();
  const ordersSnapshot = await adminDb.collection("orders").get();
  const orders = ordersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as any[];

  const usersWithOrderCount = usersSnapshot.docs.map((doc) => {
    const user = { id: doc.id, ...(doc.data() as any), role: doc.data()?.role || "user" };
    return {
      ...user,
      orders: orders.filter((o) => o.userId === user.id).length,
      totalSpent: orders
        .filter((o) => o.userId === user.id)
        .reduce((sum, o) => sum + (o.totalAmount || o.total || 0), 0),
    };
  });

  return NextResponse.json(usersWithOrderCount);
}

// PUT → update a user
export async function PUT(request: NextRequest) {
  const check = await requireRole(request, "canUpdateUsers");
  if (check instanceof NextResponse) return check;

  const { userId, name, email, role } = await request.json();

  if (!userId) return NextResponse.json({ error: "User ID required" }, { status: 400 });

  const updateData: any = { updatedAt: new Date().toISOString() };
  if (name !== undefined) updateData.name = name;
  if (email !== undefined) updateData.email = email;
  if (role !== undefined) updateData.role = role;

  await adminDb.collection("users").doc(userId).update(updateData);

  return NextResponse.json({ success: true, message: "User updated successfully" });
}

// DELETE → remove a user
export async function DELETE(request: NextRequest) {
  const check = await requireRole(request, "canDeleteUsers");
  if (check instanceof NextResponse) return check;

  const { userId } = await request.json();
  if (!userId) return NextResponse.json({ error: "User ID required" }, { status: 400 });

  const userDoc = await adminDb.collection("users").doc(userId).get();
  if (userDoc.exists && userDoc.data()?.role === "admin") {
    return NextResponse.json({ error: "Cannot delete admin users" }, { status: 403 });
  }

  await adminDb.collection("users").doc(userId).delete();
  return NextResponse.json({ success: true });
}
