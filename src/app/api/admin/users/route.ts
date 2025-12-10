import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
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
    if (!hasPermission(userRole, "canViewUsers")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Fetch real users from Firebase
    const usersSnapshot = await getDocs(collection(db, "users"));
    const users = usersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      role: doc.data().role || "user", // Default to user role if not set
    })) as any[];

    // Get order counts for each user
    const ordersSnapshot = await getDocs(collection(db, "orders"));
    const orders = ordersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as any[];

    const usersWithOrderCount = users.map((user) => ({
      ...user,
      role: user.role || "user", // Default to 'user' role if not set
      orders: orders.filter((order) => order.userId === user.id).length,
      totalSpent: orders
        .filter((order) => order.userId === user.id)
        .reduce((sum, order) => sum + (order.totalAmount || order.total || 0), 0),
    }));

    return NextResponse.json(usersWithOrderCount);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check authentication and permissions
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = token.role as UserRole;
    if (!hasPermission(userRole, "canUpdateUsers")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { userId, name, email, role } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Validate role if provided (admin role is set separately via setup API)
    if (role !== undefined) {
      const validRoles: UserRole[] = ["user", "admin"];
      if (!validRoles.includes(role as UserRole)) {
        return NextResponse.json(
          { error: `Invalid role. Valid roles are: ${validRoles.join(", ")}` },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;

    // Update user in Firebase
    await updateDoc(doc(db, "users", userId), updateData);

    return NextResponse.json({
      success: true,
      message: `User updated successfully${role ? ` with role: ${role}` : ""}`,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication and permissions
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = token.role as UserRole;
    if (!hasPermission(userRole, "canDeleteUsers")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Prevent deletion of admin users
    const userRef = doc(db, "users", userId);
    const userSnapshot = await getDoc(userRef);

    if (userSnapshot.exists()) {
      const userData = userSnapshot.data();
      if (userData.role === "admin") {
        return NextResponse.json({ error: "Cannot delete admin users" }, { status: 403 });
      }
    }

    // Delete user from Firebase
    await deleteDoc(doc(db, "users", userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
