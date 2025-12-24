import type { NextAuthConfig } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";
import { UserRole } from "./lib/rbac/roles";

export const authConfig: NextAuthConfig = {
  providers: [], // Providers added in auth.ts

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role as UserRole;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        (session.user as any).role = token.role as UserRole;
      }
      return session;
    },
  },

  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
  },
};
