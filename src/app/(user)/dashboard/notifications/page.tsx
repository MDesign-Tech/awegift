import RoleProtectedRoute from "@/components/auth/RoleProtectedRoute";
import DashboardNotificationsClient from "@/components/dashboard/DashboardNotificationsClient";

export const dynamic = "force-dynamic";

export default function NotificationsPage() {
  return (
    <RoleProtectedRoute
          allowedRoles={["admin"]}
          loadingMessage="Loading notifications..."
        >
      
        <DashboardNotificationsClient />
    </RoleProtectedRoute>
  )
}
