"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";
import { USER_ROLES, getDashboardRoute } from "@/lib/rbac/permissions";
import AccessDenied from "@/components/admin/AccessDenied";

interface RoleProtectedRouteProps {
  children: ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
  showAccessDenied?: boolean;
}

export default function RoleProtectedRoute({
  children,
  allowedRoles,
  redirectTo,
  showAccessDenied = true,
}: RoleProtectedRouteProps) {
  const { data: session, status } = useSession();
  const userRole = session?.user?.role;
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      router.push("/auth/signin");
      return;
    }

    if (userRole && !allowedRoles.includes(userRole)) {
      // If showAccessDenied is false, redirect to appropriate dashboard
      if (!showAccessDenied) {
        const redirectRoute = redirectTo || getDashboardRoute(userRole as any);
        router.push(redirectRoute);
      }
      return;
    }
  }, [session, status, userRole, allowedRoles, redirectTo, router, showAccessDenied]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  if (userRole && !allowedRoles.includes(userRole)) {
    if (showAccessDenied) {
      return (
        <AccessDenied
          title="Access Denied"
          message="You don't have permission to access this page. Your role may have been changed."
          backHref={getDashboardRoute(userRole)}
          backLabel={`Go to ${userRole} Dashboard`}
        />
      );
    }
    return null;
  }

  return <>{children}</>;
}
