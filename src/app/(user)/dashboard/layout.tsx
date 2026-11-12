import RoleProtectedRoute from "@/components/auth/RoleProtectedRoute";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function DashboardPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleProtectedRoute allowedRoles={["admin"]} loadingMessage="Loading your dashboard...">
      <DashboardLayout>{children}</DashboardLayout>
    </RoleProtectedRoute>
  );
}