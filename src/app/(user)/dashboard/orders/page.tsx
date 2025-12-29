import RoleProtectedRoute from "@/components/auth/RoleProtectedRoute";
import DashboardOrdersClient from "@/components/dashboard/DashboardOrdersClient";

export default function OrdersPage() {
  return (
    <RoleProtectedRoute
          allowedRoles={["admin"]}
          loadingMessage="Loading orders..."
        >
      <DashboardOrdersClient />
    </RoleProtectedRoute>
  )
}