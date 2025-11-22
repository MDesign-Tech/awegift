import Link from "next/link";
import { FiLock, FiArrowLeft } from "react-icons/fi";

interface AccessDeniedProps {
  title?: string;
  message?: string;
  showBackButton?: boolean;
  backHref?: string;
  backLabel?: string;
}

export default function AccessDenied({
  title = "Access Denied",
  message = "You don't have permission to access this feature.",
  showBackButton = true,
  backHref = "/account",
  backLabel = "Back to Account"
}: AccessDeniedProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-red-100 mb-6">
          <FiLock className="h-12 w-12 text-red-600" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600 mb-8 max-w-md">{message}</p>

        {showBackButton && (
          <Link
            href={backHref}
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <FiArrowLeft className="w-4 h-4 mr-2" />
            {backLabel}
          </Link>
        )}
      </div>
    </div>
  );
}