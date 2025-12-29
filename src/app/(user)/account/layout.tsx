import ProtectedRoute from "@/components/ProtectedRoute";
import AccountLayout from "../../../components/account/AccountLayout";

export default function AccountPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute loadingMessage="Loading your account...">
      <AccountLayout>{children}</AccountLayout>
    </ProtectedRoute>
  )
}
