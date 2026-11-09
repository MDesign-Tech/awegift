"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { IoClose } from "react-icons/io5";
import SignInForm from "@/components/auth/SignInForm";
import RegisterForm from "@/components/auth/RegisterForm";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import { AuthModalMode } from "@/lib/authModal";

interface AuthModalContextValue {
  openAuthModal: (mode?: AuthModalMode, callbackUrl?: string) => void;
}

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export const useAuthModal = () => {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error("useAuthModal must be used within AuthModalProvider");
  }
  return context;
};

interface AuthModalProviderProps {
  children: ReactNode;
}

export default function AuthModalProvider({
  children,
}: AuthModalProviderProps) {
  const [mode, setMode] = useState<AuthModalMode | "registrationSent" | null>(
    null
  );
  const [callbackUrl, setCallbackUrl] = useState<string>();
  const [registeredEmail, setRegisteredEmail] = useState("");
  const pathname = usePathname();
  const router = useRouter();

  const openAuthModal = useCallback(
    (nextMode: AuthModalMode = "signIn", nextCallbackUrl?: string) => {
      setCallbackUrl(nextCallbackUrl);
      setMode(nextMode);
    },
    []
  );
  const closeModal = useCallback(() => setMode(null), []);

  useEffect(() => {
    const handleRequest = (event: Event) => {
      const detail = (event as CustomEvent<{
        mode?: AuthModalMode;
        callbackUrl?: string;
      }>).detail;
      openAuthModal(detail?.mode, detail?.callbackUrl);
    };
    window.addEventListener("awegift:auth-modal", handleRequest);
    return () => window.removeEventListener("awegift:auth-modal", handleRequest);
  }, [openAuthModal]);

  useEffect(() => {
    const handleAnchorClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.target === "_blank") return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      const routes: Record<string, AuthModalMode> = {
        "/auth/signin": "signIn",
        "/auth/register": "signUp",
        "/auth/forgot-password": "forgotPassword",
      };
      const nextMode = routes[url.pathname];
      if (!nextMode) return;
      event.preventDefault();
      openAuthModal(nextMode, url.searchParams.get("callbackUrl") || undefined);
    };
    document.addEventListener("click", handleAnchorClick, true);
    return () => document.removeEventListener("click", handleAnchorClick, true);
  }, [openAuthModal]);

  useEffect(() => {
    const routeModes: Record<string, AuthModalMode> = {
      "/auth/signin": "signIn",
      "/auth/register": "signUp",
      "/auth/forgot-password": "forgotPassword",
    };
    const routeMode = routeModes[pathname];
    if (routeMode) openAuthModal(routeMode);
  }, [pathname, openAuthModal]);

  useEffect(() => {
    if (!mode) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mode, closeModal]);

  const value = useMemo(() => ({ openAuthModal }), [openAuthModal]);

  const handleSignInSuccess = useCallback(async () => {
    closeModal();
    router.refresh();
    if (callbackUrl) {
      try {
        const destination = new URL(callbackUrl, window.location.origin);
        const relativeDestination =
          `${destination.pathname}${destination.search}${destination.hash}`;
        if (
          destination.origin === window.location.origin &&
          relativeDestination !== pathname
        ) {
          router.push(relativeDestination);
        }
      } catch {
        return;
      }
    }
  }, [callbackUrl, closeModal, pathname, router]);

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      {mode && typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeModal();
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="auth-modal-title"
              className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 shadow-xl sm:p-8"
            >
              <button
                type="button"
                onClick={closeModal}
                aria-label="Close authentication dialog"
                className="absolute right-4 top-4 rounded p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-theme-color active:bg-gray-200"
              >
                <IoClose className="h-6 w-6" />
              </button>
              <div className="mb-6 pr-8">
                <h2 id="auth-modal-title" className="text-2xl font-bold text-gray-900">
                  {mode === "signIn" && "Sign In"}
                  {mode === "signUp" && "Create Account"}
                  {mode === "forgotPassword" && "Forgot Your Password?"}
                  {mode === "registrationSent" && "Verify Your Email"}
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  {mode === "signIn" && "Sign in to continue."}
                  {mode === "signUp" && "Create an account to get started."}
                  {mode === "forgotPassword" &&
                    "Enter your email and we’ll send you a reset link."}
                  {mode === "registrationSent" &&
                    `A verification code was sent to ${registeredEmail}.`}
                </p>
              </div>
              {mode === "signIn" && (
                <SignInForm
                  onSuccess={handleSignInSuccess}
                  callbackUrl={callbackUrl || pathname}
                  onRequestSignUp={() => setMode("signUp")}
                  onRequestForgotPassword={() => setMode("forgotPassword")}
                />
              )}
              {mode === "signUp" && (
                <RegisterForm
                  onSuccess={(email) => {
                    setRegisteredEmail(email);
                    setMode("registrationSent");
                  }}
                  onRequestSignIn={() => setMode("signIn")}
                />
              )}
              {mode === "forgotPassword" && (
                <ForgotPasswordForm onRequestSignIn={() => setMode("signIn")} />
              )}
              {mode === "registrationSent" && (
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => {
                      closeModal();
                      router.push(
                        `/auth/verify-email?email=${encodeURIComponent(registeredEmail)}`
                      );
                    }}
                    className="w-full rounded-md bg-theme-color px-4 py-2 text-sm font-medium text-white hover:bg-accent-color focus:outline-none focus:ring-2 focus:ring-theme-color"
                  >
                    Enter verification code
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("signIn")}
                    className="w-full text-center text-sm font-medium text-theme-color hover:text-accent-color"
                  >
                    Back to Sign In
                  </button>
                </div>
              )}
            </section>
          </div>,
          document.body
        )}
    </AuthModalContext.Provider>
  );
}
