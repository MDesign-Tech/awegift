import NotificationsClient from "@/components/account/NotificationsClient";
import RoleProtectedRoute from "@/components/auth/RoleProtectedRoute";


export default function NotificationsPage() {
  return (
    <RoleProtectedRoute allowedRoles={["admin","user"]} loadingMessage="Loading notifications">
      <NotificationsClient />
    </RoleProtectedRoute>
  )
}
