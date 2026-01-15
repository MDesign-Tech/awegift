import RoleProtectedRoute from "@/components/auth/RoleProtectedRoute";
import DashboardQuotesClient from "@/components/dashboard/DashboardQuotesClient";

export default function QuotesPage() {
  return (
    <RoleProtectedRoute
          allowedRoles={["admin"]}
          loadingMessage="Loading quotations..."
        >
      <DashboardQuotesClient />
    </RoleProtectedRoute>
  )
}