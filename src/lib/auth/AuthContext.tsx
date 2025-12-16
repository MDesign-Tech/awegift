"use client";

import React, { createContext, useContext } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

interface AuthContextType {
  user: any;
  loading: boolean;
  signInWithEmailAndPassword: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signInWithGithub: () => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  const user = session?.user || null;

  const loading = status === "loading";

  const signInWithEmailAndPassword = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: new Error(data.error || "Login failed") };
      }

      // On success, create session with NextAuth
      const result = await signIn("credentials", {
        email: data.user.email,
        password: "authenticated", // Special password to indicate pre-authenticated
        redirect: false
      });

      if (result?.error) {
        return { error: new Error("Session creation failed") };
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      await signIn("google", { callbackUrl: "/" });
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signInWithGithub = async () => {
    try {
      await signIn("github", { callbackUrl: "/" });
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: "/" });
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signInWithEmailAndPassword,
    signInWithGoogle,
    signInWithGithub,
    signOut: handleSignOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}