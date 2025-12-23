import RoleProtectedRoute from "@/components/auth/RoleProtectedRoute";
import DashboardUsersClient from "@/components/dashboard/DashboardUsersClient";

export default function UsersPage() {
  return (
    <RoleProtectedRoute
          allowedRoles={["admin"]}
          loadingMessage="Loading users..."
        >
      <DashboardUsersClient />
    </RoleProtectedRoute>
  )
}