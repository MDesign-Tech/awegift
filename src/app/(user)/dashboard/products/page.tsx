import RoleProtectedRoute from "@/components/auth/RoleProtectedRoute";
import DashboardProductsClient from "@/components/dashboard/DashboardProductsClient";

export default function ProductsPage() {
  return (
    <RoleProtectedRoute
          allowedRoles={["admin"]}
          loadingMessage="Loading products..."
        >
      <DashboardProductsClient />
    </RoleProtectedRoute>
  )
}