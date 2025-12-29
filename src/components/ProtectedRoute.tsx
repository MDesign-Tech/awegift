"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Container from "@/components/Container";
import { FiLoader } from "react-icons/fi";
import Link from "next/link";
import toast from "react-hot-toast";

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallbackPath?: string;
  loadingMessage?: string;
}

const ProtectedRoute = ({
  children,
  fallbackPath = "/auth/signin",
  loadingMessage = "Checking authentication...",
}: ProtectedRouteProps) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [networkError, setNetworkError] = useState(false);

  useEffect(() => {
    if (status === "loading" && !networkError) {
      const timer = setTimeout(() => {
        setNetworkError(true);
        toast.error("Network error");
      }, 10000); // 10 seconds timeout
      return () => clearTimeout(timer);
    }

    if (status === "loading") {
      return; // Still loading
    }

    if (status === "unauthenticated" || !session?.user || networkError) {
      setIsRedirecting(true);
      // Add a small delay to show the message before redirecting
      const timer = setTimeout(() => {
        router.push(fallbackPath);
      }, 1500);

      return () => clearTimeout(timer);
    } else {
      setIsRedirecting(false);
    }
  }, [session, status, router, fallbackPath, networkError]);

  // Show loading state while checking authentication
  if (status === "loading" && !networkError) {
    return (
      <Container className="py-8">
        <div className="flex flex-col items-center justify-center min-h-96">
          <FiLoader className="animate-spin text-4xl text-theme-color mb-4" />
          <p className="text-gray-600">{loadingMessage}</p>
        </div>
      </Container>
    );
  }

  // Show redirect message when unauthenticated or network error
  if (
    status === "unauthenticated" ||
    (!session?.user && status === "authenticated") ||
    networkError ||
    isRedirecting
  ) {
    return (
      <Container className="py-8">
        <div className="text-center">
          <div className="text-6xl mb-4">{networkError ? "🌐" : "🔒"}</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {networkError ? "Network Error" : "Authentication Required"}
          </h1>
          <p className="text-gray-600 mb-6">
            {networkError
              ? "Unable to connect to the server. Please check your internet connection and try again."
              : "You need to be signed in to access this page."
            }
          </p>

          <div className="flex items-center justify-center space-x-4 mb-6">
            <FiLoader className="animate-spin text-xl text-theme-color" />
            <span className="text-gray-500">Checking authentication...</span>
          </div>

          <div className="space-x-4">
            {networkError ? (
              <>
                <button
                  onClick={() => window.location.reload()}
                  className="inline-block bg-theme-color text-white px-6 py-2 rounded hover:bg-theme-color/80"
                >
                  Retry
                </button>
                <Link
                  href="/"
                  className="inline-block bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
                >
                  Go Home
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  className="inline-block bg-theme-color text-white px-6 py-2 rounded hover:bg-theme-color/80"
                >
                  Sign In
                </Link>
                <button
                  onClick={() => window.location.reload()}
                  className="inline-block bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
                >
                  Refresh Page
                </button>
              </>
            )}
          </div>
        </div>
      </Container>
    );
  }

  // Render children if authenticated
  return <>{children}</>;
};

export default ProtectedRoute;
