"use client";

import { FormEvent, useState } from "react";
import { toast } from "react-hot-toast";

interface ForgotPasswordFormProps {
  onRequestSignIn?: () => void;
}

export default function ForgotPasswordForm({
  onRequestSignIn,
}: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Something went wrong");
        return;
      }
      setIsSubmitted(true);
      toast.success("Password reset email sent!");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="space-y-5">
        <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-800">
          If an account with this email exists, you&apos;ll receive a password reset link.
          Check your spam folder if it doesn&apos;t arrive.
        </div>
        {onRequestSignIn && (
          <button
            type="button"
            onClick={onRequestSignIn}
            className="w-full font-medium text-theme-color hover:text-accent-color"
          >
            Back to Sign In
          </button>
        )}
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <label className="block text-sm font-medium text-gray-700" htmlFor="reset-email">
        Email address
      </label>
      <input
        id="reset-email"
        name="email"
        type="email"
        autoComplete="email"
        required
        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-theme-color focus:outline-none focus:ring-theme-color"
        placeholder="Enter your email address"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-md bg-theme-color px-4 py-2 text-sm font-medium text-white hover:bg-accent-color focus:outline-none focus:ring-2 focus:ring-theme-color disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? "Sending..." : "Send Reset Link"}
      </button>
      {onRequestSignIn && (
        <button
          type="button"
          onClick={onRequestSignIn}
          className="w-full text-center text-sm font-medium text-theme-color hover:text-accent-color"
        >
          Back to Sign In
        </button>
      )}
    </form>
  );
}
