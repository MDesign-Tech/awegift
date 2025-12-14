import QuotesList from "@/components/account/QuotesList";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function QuotesPage() {
  return (
    <ProtectedRoute loadingMessage="Loading your quotes...">
      <div>
        <QuotesList showHeader={true} />
      </div>
    </ProtectedRoute>
  );
}