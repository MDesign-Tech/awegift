import RoleProtectedRoute from "@/components/auth/RoleProtectedRoute";
import DashboardOverviewClient from "@/components/dashboard/DashboardOverviewClient";

export default function DashboardPage() {
  return (
    <RoleProtectedRoute 
      allowedRoles={["admin", "deliveryman", "packer", "accountant"]}
      loadingMessage="Loading your dashboard..."
    >
      <DashboardOverviewClient />
    </RoleProtectedRoute>
  );
}