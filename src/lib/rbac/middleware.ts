import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { UserRole, getDefaultDashboardRoute } from "@/lib/rbac/roles";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

// Define protected routes and their required roles
// Using array to ensure proper order (more specific routes first)
export const PROTECTED_ROUTES: Array<{ route: string; roles: UserRole[] }> = [
  { route: "/dashboard/admin", roles: ["admin"] },
  { route: "/dashboard/delivery", roles: ["admin", "deliveryman"] },
  { route: "/dashboard/packer", roles: ["admin", "packer"] },
  { route: "/dashboard/accountant", roles: ["admin", "accountant"] },
  {
    route: "/account",
    roles: ["admin", "deliveryman", "packer", "accountant", "user"],
  },
];

export async function withRoleAuth(
  request: NextRequest,
  requiredRoles: UserRole[]
) {
  const token = await getToken({ req: request });

  if (!token || !token.sub) {
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }

  try {
    // Fetch the current role from database
    const userDoc = await getDoc(doc(db, "users", token.sub));
    let userRole: UserRole = "user";

    if (userDoc.exists()) {
      const userData = userDoc.data();
      userRole = (userData.role as UserRole) || "user";
    }

    if (!requiredRoles.includes(userRole)) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Error fetching user role in middleware:", error);
    // Fallback to token role if database fetch fails
    const userRole = (token.role as UserRole) || "user";
    if (!requiredRoles.includes(userRole)) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
    return NextResponse.next();
  }
}

export async function checkRouteAccess(
  userId: string,
  pathname: string
): Promise<boolean> {
  try {
    // Fetch the current role from database
    const userDoc = await getDoc(doc(db, "users", userId));
    let userRole: UserRole = "user";

    if (userDoc.exists()) {
      const userData = userDoc.data();
      userRole = (userData.role as UserRole) || "user";
    }

    // Check if the path starts with any protected route
    for (const { route, roles } of PROTECTED_ROUTES) {
      if (pathname.startsWith(route)) {
        return roles.includes(userRole);
      }
    }

    return true; // Allow access to unprotected routes
  } catch (error) {
    console.error("Error checking route access:", error);
    return false; // Deny access on error
  }
}


