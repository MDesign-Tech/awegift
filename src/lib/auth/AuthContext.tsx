"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { firebaseAuth, AuthUser } from "./firebaseAuth";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signInWithEmailAndPassword: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: any }>;
  signInWithGoogle: (rememberMe?: boolean) => Promise<{ error: any }>;
  signInWithGithub: (rememberMe?: boolean) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChanged((authUser) => {
      setUser(authUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithEmailAndPassword = async (email: string, password: string, rememberMe = false) => {
    const result = await firebaseAuth.signInWithEmailAndPassword(email, password, rememberMe);
    return { error: result.error };
  };

  const signInWithGoogle = async (rememberMe = false) => {
    const result = await firebaseAuth.signInWithGoogle(rememberMe);
    return { error: result.error };
  };

  const signInWithGithub = async (rememberMe = false) => {
    const result = await firebaseAuth.signInWithGithub(rememberMe);
    return { error: result.error };
  };

  const signOut = async () => {
    const result = await firebaseAuth.signOut();
    return { error: result.error };
  };

  const value: AuthContextType = {
    user,
    loading,
    signInWithEmailAndPassword,
    signInWithGoogle,
    signInWithGithub,
    signOut,
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