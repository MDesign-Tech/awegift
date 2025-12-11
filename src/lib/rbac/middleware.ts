import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { UserRole, getDefaultDashboardRoute } from "@/lib/rbac/roles";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

// ------------------------ PROTECTED ROUTES ------------------------
// Only use roles defined in your simplified system: "admin" and "user"
export const PROTECTED_ROUTES: Array<{ route: string; roles: UserRole[] }> = [
  // Admin dashboard → only admin
  { route: "/dashboard/admin", roles: ["admin"] },

  // User account pages → all users
  { route: "/account", roles: ["admin", "user"] },
];

// ------------------------ MIDDLEWARE FUNCTION ------------------------
export async function withRoleAuth(
  request: NextRequest,
  requiredRoles: UserRole[]
) {
  const token = await getToken({ req: request });

  // Not logged in → redirect to login
  if (!token || !token.sub) {
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }

  try {
    // Fetch user role from Firestore
    const userDoc = await getDoc(doc(db, "users", token.sub));
    let userRole: UserRole = "user";

    if (userDoc.exists()) {
      userRole = (userDoc.data().role as UserRole) || "user";
    }

    // Role check
    if (!requiredRoles.includes(userRole)) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error("RBAC Error:", error);

    // fallback to token role
    const userRole = (token.role as UserRole) || "user";

    if (!requiredRoles.includes(userRole)) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    return NextResponse.next();
  }
}

// ------------------------ CHECK ROUTE ACCESS UTILITY ------------------------
export async function checkRouteAccess(
  userId: string,
  pathname: string
): Promise<boolean> {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    let userRole: UserRole = "user";

    if (userDoc.exists()) {
      userRole = (userDoc.data().role as UserRole) || "user";
    }

    for (const { route, roles } of PROTECTED_ROUTES) {
      if (pathname.startsWith(route)) {
        return roles.includes(userRole);
      }
    }

    // Allow access to routes not in PROTECTED_ROUTES
    return true;
  } catch (error) {
    console.error("Route Access Error:", error);
    return false; // Deny access if something goes wrong
  }
}
