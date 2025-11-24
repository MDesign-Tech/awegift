export const config = {
  matcher: [
    "/account/:path*",
    "/cart/:path*",
    "/auth/:path*",
    "/success/:path*",
    "/checkout/:path*",
    "/admin/:path*",
    "/delivery/:path*",
    "/packer/:path*",
    "/accountant/:path*",
  ],
};

import { NextResponse } from "next/server";
import { auth } from "./auth";
import { checkRouteAccess } from "@/lib/rbac/middleware";
import { UserRole, getDefaultDashboardRoute } from "@/lib/rbac/roles";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

const protectedRoutes = [
  "/account",
  "/checkout",
  "/success",
  "/admin",
  "/delivery",
  "/packer",
  "/accountant",
];
const authRoutes = ["/auth/signin", "/auth/register"];

export async function middleware(request: any) {
  const { pathname } = request.nextUrl;
  const session = await auth();

  // Restrict protected routes to logged-in users
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!session?.user) {
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }

    // Check role-based access using database role
    const hasAccess = await checkRouteAccess(session.user.id, pathname);

    if (!hasAccess) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  // Prevent access to auth pages for logged-in users
  if (authRoutes.some((route) => pathname.startsWith(route))) {
    if (session?.user) {
      // For auth routes, we can use session role since it's just for redirect
      const userRole = session.user.role as UserRole;
      const dashboardRoute = getDefaultDashboardRoute(userRole);
      return NextResponse.redirect(new URL(dashboardRoute, request.url));
    }
  }

  // Handle success page - ensure user is logged in and has session_id
  if (pathname.startsWith("/success")) {
    if (!session?.user) {
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }

    const sessionId = request.nextUrl.searchParams.get("session_id");
    if (!sessionId) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Handle checkout page - ensure user is logged in
  if (pathname.startsWith("/checkout")) {
    if (!session?.user) {
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }
  }

  return NextResponse.next();
}
