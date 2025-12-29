import RoleProtectedRoute from "@/components/auth/RoleProtectedRoute";
import DashboardAnalyticsClient from "@/components/dashboard/DashboardAnalyticsClient";

export default function AnalyticsPage() {
  return (
    <RoleProtectedRoute
          allowedRoles={["admin"]}
          loadingMessage="Loading analytics..."
        >
      <DashboardAnalyticsClient />
    </RoleProtectedRoute>
  )
}