import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ProtectedAdminRoute from "@/components/auth/ProtectedAdminRoute";

export default function DashboardPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedAdminRoute>
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedAdminRoute>
  );
}