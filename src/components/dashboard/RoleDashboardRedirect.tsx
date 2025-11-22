"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getDefaultDashboardRoute, canAccessDashboard } from "@/lib/rbac/roles";
import MainLoader from "@/components/MainLoader";

export default function RoleDashboardRedirect() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Still loading

    if (!session?.user) {
      router.push("/auth/signin");
      return;
    }

    const userRole = session.user.role || "user";

    // Check if user has access to any dashboard
    const dashboardTypes = ["admin", "delivery", "packer", "accountant", "user"] as const;
    const accessibleDashboard = dashboardTypes.find(type => canAccessDashboard(userRole, type));

    if (accessibleDashboard) {
      const dashboardRoute = getDefaultDashboardRoute(userRole);
      router.push(dashboardRoute);
    } else {
      // If no dashboard access, redirect to account or home
      router.push("/account");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return <MainLoader />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <MainLoader />
    </div>
  );
}
