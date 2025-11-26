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
      case "deliveryman":
        return {
          title: `${getRoleDisplayName(role as UserRole)} Dashboard`,
          description: "Handle shipping, delivery tracking, and logistics management"
        };
      case "packer":
        return {
          title: `${getRoleDisplayName(role as UserRole)} Dashboard`,
          description: "Manage order fulfillment, packing, and inventory tracking"
        };
      case "accountant":
        return {
          title: `${getRoleDisplayName(role as UserRole)} Dashboard`,
          description: "Handle financial management, payments, and accounting reports"
        };
      default:
        return {
          title: "Dashboard",
          description: "Your dashboard overview"
        };
    }
  };

  const roleInfo = getRoleInfo(userRole);

  return (
    <Container className="py-10">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {roleInfo.title}
          </h1>
          <p className="text-gray-600 mt-2">
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