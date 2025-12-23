import { UserRole } from "./lib/rbac/roles";

export const authConfig = {
    providers: [], // Providers added in auth.ts
    callbacks: {
        async jwt({ token, user, account, profile, trigger, session }: any) {
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
        async session({ session, token }: any) {
            if (session.user) {
                (session.user as any).id = token.id as string;
                (session.user as any).role = (token.role as UserRole) || "user";
            }
            return session;
        },
    },
    pages: {
        signIn: "/auth/signin",
        error: "/auth/signin",
    },
};
