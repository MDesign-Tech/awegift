import RoleProtectedRoute from "@/components/auth/RoleProtectedRoute";
import DashboardCategoriesClient from "@/components/dashboard/DashboardCategoriesClient";

export default function CategoriesPage() {
  return (
    <RoleProtectedRoute
          allowedRoles={["admin"]}
          loadingMessage="Loading categories..."
        >
      <DashboardCategoriesClient />
    </RoleProtectedRoute>
  )
}