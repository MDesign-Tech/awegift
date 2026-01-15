import RoleProtectedRoute from "@/components/auth/RoleProtectedRoute";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

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