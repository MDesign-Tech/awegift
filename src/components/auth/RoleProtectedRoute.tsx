"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, ReactNode } from "react";
import { getDefaultDashboardRoute } from "@/lib/rbac/roles";
import RoleDashboardRedirect from "@/components/dashboard/RoleDashboardRedirect";
import Container from "@/components/Container";
import { FiLoader } from "react-icons/fi";
import Link from "next/link";

interface RoleProtectedRouteProps {
  children: ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
  fallbackPath?: string;
  loadingMessage?: string;
}

export default function RoleProtectedRoute({
  children,
  allowedRoles,
  redirectTo,
  fallbackPath = "/auth/signin",
  loadingMessage = "Checking authentication and permissions...",
}: RoleProtectedRouteProps) {
  const { data: session, status } = useSession();
  const userRole = session?.user?.role;
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirectReason, setRedirectReason] = useState<"unauthenticated" | "unauthorized" | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      setRedirectReason("unauthenticated");
      setIsRedirecting(true);
      
      const timer = setTimeout(() => {
        router.push(fallbackPath);
      }, 1500);

      return () => clearTimeout(timer);
    }

    if (userRole && !allowedRoles.includes(userRole)) {
      setRedirectReason("unauthorized");
      setIsRedirecting(true);
      
      const redirectRoute = redirectTo || getDefaultDashboardRoute(userRole as any);
      const timer = setTimeout(() => {
        router.push(redirectRoute);
      }, 1500);

      return () => clearTimeout(timer);
    }

    setIsRedirecting(false);
    setRedirectReason(null);
  }, [session, status, userRole, allowedRoles, redirectTo, router, fallbackPath]);

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <Container className="py-8">
        <div className="flex flex-col items-center justify-center min-h-96">
          <FiLoader className="animate-spin text-4xl text-theme-color mb-4" />
          <p className="text-gray-600">{loadingMessage}</p>
        </div>
      </Container>
    );
  }

  // Show redirect message when unauthenticated or unauthorized
  if (isRedirecting && redirectReason) {
    const isUnauthenticated = redirectReason === "unauthenticated";
    
    return (
      <Container className="py-8">
        <div className="text-center">
          <div className="text-6xl mb-4">{isUnauthenticated ? "🔒" : "🚫"}</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isUnauthenticated ? "Authentication Required" : "Access Denied"}
          </h1>
          <p className="text-gray-600 mb-6">
            {isUnauthenticated 
              ? "You need to be signed in to access this page."
              : "You don't have permission to access this page."}
          </p>

          {/* Debug information */}
          <div className="bg-gray-100 p-4 rounded mb-4 text-sm text-left max-w-md mx-auto">
            <div>
              <strong>Status:</strong> {status}
            </div>
            <div>
              <strong>Has Session:</strong> {session ? "Yes" : "No"}
            </div>
            <div>
              <strong>Has User:</strong> {session?.user ? "Yes" : "No"}
            </div>
            {session?.user && (
              <>
                <div>
                  <strong>User Email:</strong> {session.user.email}
                </div>
                <div>
                  <strong>User Role:</strong> {userRole}
                </div>
                <div>
                  <strong>Allowed Roles:</strong> {allowedRoles.join(", ")}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center justify-center space-x-4 mb-6">
            <FiLoader className="animate-spin text-xl text-theme-color" />
            <span className="text-gray-500">
              {isUnauthenticated ? "Redirecting to sign in..." : "Redirecting to your dashboard..."}
            </span>
          </div>

          <div className="space-x-4">
            {isUnauthenticated ? (
              <Link
                href="/auth/signin"
                className="inline-block bg-theme-color text-white px-6 py-2 rounded hover:bg-theme-color/80"
              >
                Sign In
              </Link>
            ) : (
              <button
                onClick={() => router.push(redirectTo || getDefaultDashboardRoute(userRole as any))}
                className="inline-block bg-theme-color text-white px-6 py-2 rounded hover:bg-theme-color/80"
              >
                Go to My Dashboard
              </button>
            )}
            <button
              onClick={() => window.location.reload()}
              className="inline-block bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </Container>
    );
  }

  // Use RoleDashboardRedirect for unauthorized access (fallback)
  if (userRole && !allowedRoles.includes(userRole)) {
    return <RoleDashboardRedirect />;
  }

  // Render children if authenticated and authorized
  return <>{children}</>;
}