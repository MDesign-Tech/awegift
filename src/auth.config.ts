import type { NextAuthConfig } from "next-auth";
import { UserRole } from "./lib/rbac/roles";

export const authConfig = {
    session: {
        strategy: "jwt",
        maxAge: 60 * 60 * 24 * 7, // 7 days
    },
    jwt: {
        maxAge: 60 * 60 * 24 * 7,
    },
    providers: [], // Providers added in auth.ts
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
            }

            // Update session when triggered
            if (trigger === "update" && session) {
                token = { ...token, ...session };
            }

            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id as string;
                (session.user as any).role = (token.role as UserRole) || "user";
            }
            return session;
        },
        authorized({ auth, request: { nextUrl } }) {
            // Logic handled in middleware.ts, returning true here allows middleware to handle redirects
            return true;
        },
    },
    pages: {
        signIn: "/auth/signin",
        error: "/auth/signin",
    },
    secret: process.env.NEXTAUTH_SECRET,
} satisfies NextAuthConfig;
