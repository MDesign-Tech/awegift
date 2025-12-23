"use client";

import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

export default function ProtectedAdminRoute({ children }: ProtectedAdminRouteProps) {
  const { isAdmin, isAuthenticated } = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    if (!isAdmin) {
      router.push("/");
      return;
    }
  }, [isAdmin, isAuthenticated, router]);

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}