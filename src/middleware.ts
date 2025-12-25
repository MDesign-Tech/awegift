import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCurrentUserData } from "@/lib/firebase/clientUser";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 🔓 Public routes → allow
  if (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname === "/" ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // 🔐 Protect /dashboard (ADMIN ONLY)
  if (pathname.startsWith("/dashboard")) {
    // Get session token
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    // Not logged in → redirect
    if (!token?.sub) {
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }

    try {
      // Fetch user from Firestore
      const user = await getCurrentUserData({ user: { id: token.sub } });

      // User not found or not admin → redirect
      if (!user || user.role !== "admin") {
        return NextResponse.redirect(new URL("/unauthorized", request.url));
      }

      // ✅ Admin → allow
      return NextResponse.next();
    } catch (error) {
      console.error("Middleware role check failed:", error);
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  // 🔓 Other routes → allow
  return NextResponse.next();
}

// Only run middleware on relevant paths
export const config = {
  matcher: [
    "/dashboard/:path*", // protect all /dashboard routes
    "/((?!api|_next/static|_next/image|favicon.ico).*)", // optional catch-all
  ],
  runtime: "nodejs", // ⚡ force Node.js runtime instead of Edge
};
