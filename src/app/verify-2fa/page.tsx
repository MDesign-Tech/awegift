"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft, FaMobileAlt } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { signIn } from "next-auth/react";

export default function Verify2FAPage() {
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const tempToken = searchParams.get("token");
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  useEffect(() => {
    if (!email || !tempToken) {
      toast.error("Invalid verification link");
      router.push("/auth/signin");
    }
  }, [email, tempToken, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/verify-2fa-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          tempToken,
          otp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Verification failed");
      }

      // If successful, sign in with NextAuth
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password, // This is a dummy password since we're bypassing password check
        redirect: false,
      });

      if (result?.ok) {
        toast.success("Sign in successful!");
        // Redirect to intended page or home
        window.location.href = callbackUrl;
      } else {
        toast.error("Login failed after 2FA verification");
        router.push("/auth/signin");
      }
    } catch (error: any) {
      toast.error(error.message || "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    // For 2FA, resend is not applicable since it's TOTP
    toast("Check your authenticator app for the code");
  };

  if (!email || !tempToken) {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Full image */}
      <div className="hidden md:block md:w-3/5 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1600&q=80"
          alt="Welcome"
          className="w-full h-full object-cover min-h-screen"
        />
      </div>

      {/* Right Side - Form */}
      <div className="w-full md:w-2/5 flex flex-col justify-center px-4 py-8 sm:px-6 lg:px-8 relative">
        <Link
          href="/auth/signin"
          className="absolute top-4 left-4 text-sm text-gray-600 hover:text-gray-800 flex items-center gap-2"
        >
          <FaArrowLeft size={16} />
          Back to Sign In
        </Link>

        <div className="mx-auto w-full max-w-sm space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                <FaMobileAlt className="w-8 h-8 text-orange-500" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900">2-Step Verification</h1>
              <p className="text-gray-600">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="otp"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Verification Code
              </label>
              <input
                id="otp"
                name="otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-theme-color focus:border-theme-color text-center text-2xl font-mono tracking-widest"
                placeholder="000000"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-theme-color hover:bg-accent-color focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-color disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Verifying..." : "Verify Code"}
              </button>
            </div>
          </form>

          {/* Additional Info */}
          <div className="text-center space-y-4">
            <p className="text-sm text-gray-600">
              Can't access your authenticator app?{" "}
              <button
                onClick={handleResend}
                className="text-theme-color hover:text-accent-color font-medium"
              >
                Try again
              </button>
            </p>
            <p className="text-xs text-gray-500">
              The code refreshes every 30 seconds
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}