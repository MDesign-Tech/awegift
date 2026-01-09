import QuotesList from "@/components/account/QuotesList";
import RoleProtectedRoute from "@/components/auth/RoleProtectedRoute";

export default function QuotesPage() {
  return (
    <RoleProtectedRoute allowedRoles={["user", "admin"]} loadingMessage="Loading your quotes...">
      <div>
        <QuotesList showHeader={true} />
      </div>
    </RoleProtectedRoute>
  );
}