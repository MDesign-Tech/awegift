import RoleProtectedRoute from "@/components/auth/RoleProtectedRoute";
import DashboardPaymentsClient from "@/components/dashboard/DashboardPaymentsClient";

export default function PaymentsPage() {
  return <RoleProtectedRoute allowedRoles={["admin"]} loadingMessage="Loading payments...">
    <DashboardPaymentsClient />
  </RoleProtectedRoute>;
}
