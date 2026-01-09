import SettingsClient from "@/components/account/SettingsClient";
import RoleProtectedRoute from "@/components/auth/RoleProtectedRoute";

export default function SettingsPage() {
  return (
    <RoleProtectedRoute allowedRoles={["user", "admin"]} loadingMessage="Loading settings...">
      <SettingsClient />
    </RoleProtectedRoute>
  );
}
