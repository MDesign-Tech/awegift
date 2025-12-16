import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkRouteAccess } from "@/lib/rbac/middleware";
import { UserRole, getDefaultDashboardRoute } from "@/lib/rbac/roles";

const roles: UserRole[] = ["user", "admin"];

const dashboardRoutes = roles
  .map(role => getDefaultDashboardRoute(role))
  .filter(route => route.startsWith("/dashboard"));


const protectedRoutes = [
  "/account",
  "/checkout",
  "/success",
  ...dashboardRoutes,
];
const authRoutes = ["/auth/signin", "/auth/register"];

export async function middleware(request: any) {
  const { pathname } = request.nextUrl;
  const session = await auth();
  const user = session?.user ? { id: session.user.id, role: (session.user as any).role } : null;

  // Restrict protected routes to logged-in users
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!user) {
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }

    // Check role-based access using database role
    const hasAccess = await checkRouteAccess(user.id, pathname);

    if (!hasAccess) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  if (pathname.startsWith("/dashboard")) {
    const userRole = user?.role;
    const dashboardRoute = getDefaultDashboardRoute(userRole as UserRole);

    if (!pathname.startsWith(dashboardRoute)) {
      return NextResponse.redirect(new URL(dashboardRoute, request.url));
    }
  }


  // Prevent access to auth pages for logged-in users
  if (authRoutes.some((route) => pathname.startsWith(route))) {
    if (user) {
      // For auth routes, we can use session role since it's just for redirect
      const userRole = user.role as UserRole;
      const dashboardRoute = getDefaultDashboardRoute(userRole);
      return NextResponse.redirect(new URL(dashboardRoute, request.url));
    }
  }

  // Handle success page - ensure user is logged in and has session_id
  if (pathname.startsWith("/success")) {
    if (!user) {
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }

    const sessionId = request.nextUrl.searchParams.get("session_id");
    if (!sessionId) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Handle checkout page - ensure user is logged in
  if (pathname.startsWith("/checkout")) {
    if (!user) {
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/account/:path*",
    "/cart/:path*",
    "/auth/:path*",
    "/success/:path*",
    "/checkout/:path*",
    "/dashboard/:path*", // match all dashboard routes
  ],
};

