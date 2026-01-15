"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const tokenParam = searchParams.get("token");
  const emailParam = searchParams.get("email");
  const successParam = searchParams.get("success");
  const errorParam = searchParams.get("error");

  useEffect(() => {
    if (emailParam) setEmail(emailParam);
    if (successParam === "true") setSuccess(true);
    if (errorParam) setError(decodeURIComponent(errorParam));

    // Auto-verify if token is present
    if (tokenParam && !successParam && !errorParam) {
      handleTokenVerification(tokenParam);
    }
  }, [tokenParam, emailParam, successParam, errorParam]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleTokenVerification = async (token: string) => {
    setIsVerifying(true);
    try {
      const response = await fetch(`/api/auth/verify-email?token=${token}`, {
        method: "GET",
        redirect: "follow"
      });

      if (response.url.includes("success=true")) {
        setSuccess(true);
      } else {
        const url = new URL(response.url);
        setError(decodeURIComponent(url.searchParams.get("error") || "Verification failed"));
      }
    } catch (err) {
      setError("An error occurred during verification");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pasted = value.slice(0, 6).split("");
      const newOtp = [...otp];
      pasted.forEach((char, i) => {
        if (index + i < 6) newOtp[index + i] = char;
      });
      setOtp(newOtp);
      // Focus last pasted or next empty
      const nextIndex = Math.min(index + pasted.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpVerify = async () => {
    const fullOtp = otp.join("");
    if (fullOtp.length < 6) {
      toast.error("Please enter all 6 digits");
      return;
    }

    if (!email) {
      toast.error("Email is missing. Please try again from registration.");
      return;
    }

    setIsVerifying(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: fullOtp }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        toast.success("Email verified successfully!");
      } else {
        setError(data.error || "Verification failed");
        toast.error(data.error || "Verification failed");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      toast.error("Email is missing");
      return;
    }

    setIsResending(true);
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        toast.success("New code sent to your email!");
        setResendTimer(60); // 1 minute cooldown
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to resend code");
      }
    } catch (err) {
      toast.error("Failed to resend code");
    } finally {
      setIsResending(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Verified & Secure</h1>
            <p className="mt-2 text-sm text-gray-600">
              Your identity has been confirmed. You can now access your full account features.
            </p>
          </div>
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-4 px-4 shadow-lg sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
              <Link
                href="/auth/signin"
                className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-theme-color hover:bg-accent-color focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-color"
              >
                Sign In to Your Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // UI for Link-based verification (Automatic)
  if (tokenParam) {
    return (
      <div className="flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {isVerifying ? "Verifying Identity" : error ? "Verification Failed" : "Authenticating"}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {isVerifying
                ? "Please wait while we secure your connection and confirm your account."
                : error
                  ? error
                  : "Finalizing your verification process..."}
            </p>
          </div>
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-4 px-4 shadow-lg sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="h-16 w-16 bg-theme-color/10 rounded-full flex items-center justify-center">
                  {isVerifying ? (
                    <svg className="animate-spin h-8 w-8 text-theme-color" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : error ? (
                    <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.268 15c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  ) : (
                    <svg className="h-8 w-8 text-theme-color" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  )}
                </div>
              </div>

              {error && (
                <Link
                  href="/auth/signin"
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-color"
                >
                  Return to Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // UI for OTP-based verification
  return (
    <div className="flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Verify your email</h1>
          <p className="mt-2 text-sm text-gray-600">
            We've sent a 6-digit code to <span className="font-semibold text-gray-900">{email || "your email"}</span>.
          </p>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-4 px-4 shadow-lg sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <div className="flex justify-between gap-2 sm:gap-4">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => { inputRefs.current[idx] = el; }}
                  type="text"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  disabled={isVerifying}
                  className="w-full h-12 text-center text-xl font-bold bg-gray-50 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-theme-color focus:border-theme-color transition-all outline-none disabled:opacity-50"
                />
              ))}
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-md text-sm font-medium border border-red-100">
                {error}
              </div>
            )}

            <button
              onClick={handleOtpVerify}
              disabled={isVerifying || otp.some(d => !d)}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-theme-color hover:bg-accent-color focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-color disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Verifying...
                </div>
              ) : "Verify Code"}
            </button>

            <div className="text-center">
              <p className="text-gray-500 text-sm">
                Didn't receive the code?{" "}
                <button
                  onClick={handleResendCode}
                  disabled={isResending || resendTimer > 0}
                  className="text-theme-color font-medium hover:text-accent-color disabled:opacity-50 disabled:no-underline transition-all"
                >
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend"}
                </button>
              </p>
            </div>
          </div>

          <div className="mt-6 border-t border-gray-300 pt-6 text-center">
            <Link href="/auth/signin" className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return <VerifyEmailContent />;
}
