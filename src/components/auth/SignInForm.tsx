"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaGoogle, FaEye, FaEyeSlash } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { signIn, useSession } from "next-auth/react";

export default function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();
  const searchParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");

    if (!error) return;

    if (error === "Please verify your email before signing in.") {
      toast.error("Please verify your email.");
      router.push("/auth/verify-email");
      return;
    }

    const errorMessages: Record<string, string> = {
      CredentialsSignin: "Invalid email or password",
      OAuthSignin: "OAuth sign-in failed",
      OAuthCallback: "OAuth authentication failed",
      AccessDenied: "Access denied",
      SessionRequired: "Please sign in to continue",
    };

    toast.error(errorMessages[error] || error || "Authentication failed");

    params.delete("error");
    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""
    }`;

    window.history.replaceState({}, "", newUrl);
  }, [router]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (session) {
      toast.error("You are already logged in.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === "Please verify your email before signing in.") {
          toast.error("Please verify your email address.");
          router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
        } else if (result.error.startsWith("2FA_REQUIRED:")) {
          const tempToken = result.error.split(":")[1];
          toast.success("2-Step Verification required");
          router.push(`/verify-2fa?email=${encodeURIComponent(email)}&token=${tempToken}&callbackUrl=${encodeURIComponent(callbackUrl)}`);
        } else {
          toast.error(result.error || "Invalid email or password");
        }
      } else if (result?.ok) {
        toast.success("Sign in successful!");
        // Force full page reload to ensure session data is applied
        window.location.href = "/";
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: "google") => {
    if (session) {
      toast.error("You are already logged in.");
      return;
    }

    try {
      await signIn(provider, { callbackUrl: "/" });
    } catch (error) {
      toast.error("OAuth sign in failed");
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email address
          </label>
          <div className="mt-1">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="off"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-theme-color focus:border-theme-color"
              placeholder="Enter your email"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <div className="mt-1 relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="off"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-theme-color focus:border-theme-color"
              placeholder="Enter your password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <FaEyeSlash className="h-5 w-5 text-gray-400" />
              ) : (
                <FaEye className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <div className="text-sm">
            <Link
              href="/auth/forgot-password"
              className="font-medium text-theme-color hover:text-accent-color"
            >
              Forgot your password?
            </Link>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-theme-color hover:bg-accent-color focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-color disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </div>
      </form>

      <div>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">
              Or continue with
            </span>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={() => handleOAuthSignIn("google")}
            className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
          >
            <FaGoogle className="h-5 w-5 text-red-500" />
            <span className="ml-2">Google</span>
          </button>
        </div>
      </div>
    </div>
  );
}