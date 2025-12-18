import { UserRole } from "./lib/rbac/roles";

export const authConfig = {
    jwt: {
        maxAge: 60 * 60 * 24 * 7,
    },
    providers: [], // Providers added in auth.ts
    callbacks: {
        async jwt({ token, user, trigger, session }: any) {
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
        authorized({ auth, request: { nextUrl } }: any) {
            // Logic handled in middleware.ts, returning true here allows middleware to handle redirects
            return true;
        },
    },
    pages: {
        signIn: "/auth/signin",
        error: "/auth/signin",
    },
    secret: process.env.NEXTAUTH_SECRET,
};
