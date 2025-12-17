import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";
import { UserRole, getDefaultDashboardRoute } from "@/lib/rbac/roles";

const { auth } = NextAuth(authConfig);

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

export default auth((req) => {
    const { nextUrl } = req;
    const isLoggedIn = !!req.auth;
    const user = req.auth?.user;
    const pathname = nextUrl.pathname;

    // Restrict protected routes to logged-in users
    if (protectedRoutes.some((route) => pathname.startsWith(route))) {
        if (!isLoggedIn) {
            return NextResponse.redirect(new URL("/auth/signin", nextUrl));
        }

        // Basic role check using session data (Edge-compatible)
        // Note: Deep RBAC checks necessitating DB access should be done in Layouts/Pages or Server Actions
        if (pathname.startsWith("/dashboard")) {
            const userRole = (user as any)?.role as UserRole || "user";
            const allowedDashboard = getDefaultDashboardRoute(userRole);

            // Prevent users from accessing other dashboards
            if (!pathname.startsWith(allowedDashboard)) {
                return NextResponse.redirect(new URL(allowedDashboard, nextUrl));
            }
        }
    }

    // Specific role checks for static routes if needed can be added here using `user.role` from token

    // Prevent access to auth pages for logged-in users
    if (authRoutes.some((route) => pathname.startsWith(route))) {
        if (isLoggedIn) {
            const userRole = (user as any)?.role as UserRole || "user";
            const dashboardRoute = getDefaultDashboardRoute(userRole);
            return NextResponse.redirect(new URL(dashboardRoute, nextUrl));
        }
    }

    // Handle success page
    if (pathname.startsWith("/success")) {
        if (!isLoggedIn) {
            return NextResponse.redirect(new URL("/auth/signin", nextUrl));
        }

        const sessionId = nextUrl.searchParams.get("session_id");
        if (!sessionId) {
            return NextResponse.redirect(new URL("/", nextUrl));
        }
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
};
