import RoleProtectedRoute from "@/components/auth/RoleProtectedRoute";
import AccountLayout from "../../../components/account/AccountLayout";

export default function AccountPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleProtectedRoute allowedRoles={["user", "admin"]} loadingMessage="Loading your account...">
      <AccountLayout>{children}</AccountLayout>
    </RoleProtectedRoute>
  )
}
