"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getDefaultDashboardRoute, UserRole } from "@/lib/rbac/roles";
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

    const userRole: UserRole = session.user.role || "user";

    // Redirect based on role; users with no special dashboard permissions go to /account
    const dashboardRoute = getDefaultDashboardRoute(userRole);
    router.push(dashboardRoute);
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
