import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { UserRole } from "@/lib/rbac/roles";
import { getServerSession } from "next-auth"; import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac/roles";
import { fetchUserFromFirestore } from "@/lib/firebase/adminUser";

// GET → fetch all users
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized - No session found" },
      { status: 401 }
    );
  }

  // Fetch user role
      const user = await fetchUserFromFirestore(session.user.id);
      if (!user) {
          return NextResponse.json(
            { error: "User deleted", code: "USER_DELETED" },
            { status: 401 }
          );
      }

  const userRole = session.user.role as UserRole;
  if (!userRole || !hasPermission(userRole, "canViewUsers")) {
    return NextResponse.json(
      { error: "Forbidden - Insufficient permissions" },
      { status: 403 }
    );
  }

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
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized - No session found" },
      { status: 401 }
    );
  }

  const userRole = session.user.role as UserRole;
  if (!userRole || !hasPermission(userRole, "canUpdateUsers")) {
    return NextResponse.json(
      { error: "Forbidden - Insufficient permissions" },
      { status: 403 }
    );
  }

  const { userId, name, email, role } = await request.json();

  if (!userId) return NextResponse.json({ error: "User ID required" }, { status: 400 });

  const updateData: any = { updatedAt: new Date().toISOString() };
  if (name !== undefined) updateData.name = name;
  if (email !== undefined) updateData.email = email;
  if (role !== undefined) updateData.role = role;

  await adminDb.collection("users").doc(userId).update(updateData);

  return NextResponse.json({ success: true, message: "User updated successfully" });
}

// DELETE → remove a user and all related data
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized - No session found" },
      { status: 401 }
    );
  }

  const userRole = session.user.role as UserRole;
  if (!userRole || !hasPermission(userRole, "canDeleteUsers")) {
    return NextResponse.json(
      { error: "Forbidden - Insufficient permissions" },
      { status: 403 }
    );
  }

  const { userId } = await request.json();
  if (!userId) return NextResponse.json({ error: "User ID required" }, { status: 400 });

  const userDoc = await adminDb.collection("users").doc(userId).get();
  if (!userDoc.exists) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const userData = userDoc.data();
  if (userData?.role === "admin") {
    return NextResponse.json({ error: "Cannot delete admin users" }, { status: 403 });
  }

  // Start a batch operation to delete user and all related data
  const batch = adminDb.batch();

  // Delete the user document
  batch.delete(adminDb.collection("users").doc(userId));

  // Delete all orders for this user
  const ordersSnapshot = await adminDb.collection("orders").where("userId", "==", userId).get();
  ordersSnapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  // Delete all quotes for this user
  const quotesSnapshot = await adminDb.collection("quotes").where("userId", "==", userId).get();
  quotesSnapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  // Delete all notifications for this user
  const notificationsSnapshot = await adminDb.collection("notifications").where("recipientId", "==", userId).get();
  notificationsSnapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  // Delete verification tokens for this user (if any)
  const verificationTokensSnapshot = await adminDb.collection("verificationTokens").where("userId", "==", userId).get();
  verificationTokensSnapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  // Delete password reset tokens for this user (if any)
  const passwordResetTokensSnapshot = await adminDb.collection("passwordResetTokens").where("userId", "==", userId).get();
  passwordResetTokensSnapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  // Commit the batch
  await batch.commit();

  return NextResponse.json({ success: true, message: "User and all related data deleted successfully" });
}
