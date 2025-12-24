import NotificationsClient from "@/components/account/NotificationsClient";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function NotificationsPage() {
  return (
    <ProtectedRoute loadingMessage="Loading your notifications...">
        <NotificationsClient />
    </ProtectedRoute>
  )
}
