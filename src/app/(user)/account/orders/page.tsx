import OrdersList from "@/components/account/OrdersList";
import RoleProtectedRoute from "@/components/auth/RoleProtectedRoute";


export default function OrdersPage() {
  return (
 <RoleProtectedRoute allowedRoles={["user", "admin"]}>
    <OrdersList showHeader={true} />
 </RoleProtectedRoute>
  );
}
