"use client";

import { useEffect, useRef, useState } from "react";

interface EmailVerificationFormProps {
  email: string;
  onVerified: () => void;
}

export default function EmailVerificationForm({
  email,
  onVerified,
}: EmailVerificationFormProps) {
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = window.setTimeout(
      () => setResendTimer((remaining) => remaining - 1),
      1000
    );
    return () => window.clearTimeout(timer);
  }, [resendTimer]);

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    if (otp.length !== 6 || isVerifying) return;

    setIsVerifying(true);
    setError("");
    setStatus("");
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Verification failed. Please try again.");
        return;
      }

      if (isMounted.current) onVerified();
    } catch {
      setError("Unable to verify your code. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!email || isResending || resendTimer > 0) return;

    setIsResending(true);
    setError("");
    setStatus("");
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to resend the verification code.");
        return;
      }

      setOtp("");
      setResendTimer(60);
      setStatus("A new verification code was sent successfully.");
      inputRef.current?.focus();
    } catch {
      setError("Unable to resend the code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <form onSubmit={handleVerify} className="space-y-5">
      <div>
        <label
          htmlFor="email-verification-code"
          className="block text-sm font-medium text-gray-700"
        >
          Verification code
        </label>
        <input
          ref={inputRef}
          id="email-verification-code"
          name="otp"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          required
          value={otp}
          disabled={isVerifying}
          onChange={(event) => {
            setOtp(event.target.value.replace(/\D/g, "").slice(0, 6));
            setError("");
          }}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-3 text-center text-xl font-bold tracking-[0.5em] placeholder:text-sm placeholder:font-normal placeholder:tracking-normal focus:border-theme-color focus:outline-none focus:ring-theme-color disabled:opacity-50"
          placeholder="6-digit code"
          aria-describedby={error ? "email-verification-error" : undefined}
        />
      </div>

      {error && (
        <p
          id="email-verification-error"
          role="alert"
          className="rounded-md border border-red-100 bg-red-50 p-3 text-sm text-red-600"
        >
          {error}
        </p>
      )}
      {status && (
        <p role="status" className="text-sm text-green-700">
          {status}
        </p>
      )}

      <button
        type="submit"
        disabled={isVerifying || otp.length !== 6}
        className="w-full rounded-md bg-theme-color px-4 py-2 text-sm font-medium text-white hover:bg-accent-color focus:outline-none focus:ring-2 focus:ring-theme-color disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isVerifying ? "Verifying..." : "Verify Code"}
      </button>

      <p className="text-center text-sm text-gray-500">
        Didn&apos;t receive the code?{" "}
        <button
          type="button"
          onClick={handleResend}
          disabled={isResending || resendTimer > 0}
          className="font-medium text-theme-color transition-colors hover:text-accent-color disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isResending
            ? "Sending..."
            : resendTimer > 0
              ? `Resend in ${resendTimer}s`
              : "Resend Code"}
        </button>
      </p>
    </form>
  );
}
