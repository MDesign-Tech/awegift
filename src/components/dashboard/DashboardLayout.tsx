"use client";

import Container from "@/components/Container";
import { useParams } from "next/navigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { UserRole, getRoleDisplayName } from "@/lib/rbac/roles";
import DashboardNavigation from "./DashboardNavigation";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const params = useParams();
  const role = params.role as string;
  const { userRole } = useCurrentUser();

  const getRoleInfo = (role: string) => {
    switch (role) {
      case "admin":
        return {
          title: `${getRoleDisplayName(role as UserRole)} Dashboard`,
          description: "Manage users, orders, analytics, and system settings"
        };
      case "user":
        return {
          title: "My Account",
          description: "View your orders, profile, and account settings"
        };
      default:
        return {
          title: "Dashboard",
          description: "Dashboard overview"
        };
    }
  };

  const roleInfo = getRoleInfo(userRole);

  return (
      <Container className="py-4">
      <div className="max-w-6xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
            {roleInfo.title}
          </h1>
            <p className="text-gray-600 text-sm sm:text-base mt-2">
            {roleInfo.description}
          </p>
        </div>

        {/* Navigation Tabs */}
        <DashboardNavigation />

        {/* Page Content */}
        <div className="min-h-[400px]">{children}</div>
      </div>
    </Container>
  );
}