import RoleProtectedRoute from "@/components/auth/RoleProtectedRoute";
import DashboardContactMessagesClient from "@/components/dashboard/DashboardContactMessagesClient";

export default function ContactMessagesPage() {
  return <RoleProtectedRoute allowedRoles={["admin"]} loadingMessage="Loading contact messages...">
    <DashboardContactMessagesClient />
  </RoleProtectedRoute>;
}
