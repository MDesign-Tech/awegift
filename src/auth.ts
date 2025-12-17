import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { compare } from "bcryptjs";
import { adminDb } from "@/lib/firebase/admin";
import { authConfig } from "./auth.config";
import { UserRole } from "@/lib/rbac/roles";

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || typeof credentials.email !== 'string') return null;

        try {
          const snapshot = await adminDb
            .collection("users")
            .where("email", "==", credentials.email)
            .limit(1)
            .get();

          if (snapshot.empty) return null;

          const doc = snapshot.docs[0];
          const user = doc.data();

          if (!user.password || typeof user.password !== 'string') return null;

          // If password is "authenticated", skip password check (used for custom login)
          if (credentials.password !== "authenticated") {
            if (!credentials.password || typeof credentials.password !== 'string') return null;
            const isValid = await compare(credentials.password, user.password);
            if (!isValid) return null;
          }

          return {
            id: doc.id,
            email: user.email,
            name: user.name,
            image: user.image || null,
            role: user.role || "user",
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider === "google" || account?.provider === "github") {
        try {
          // Check if user exists
          const existingUser = await adminDb
            .collection("users")
            .where("email", "==", user.email)
            .limit(1)
            .get();

          if (existingUser.empty) {
            // Create new user
            const newUser = {
              name: user.name || "",
              email: user.email!,
              image: user.image || "",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              emailVerified: true,
              role: "user",
              provider: account.provider,
              profile: {
                firstName: user.name?.split(" ")[0] || "",
                lastName: user.name?.split(" ").slice(1).join(" ") || "",
                phone: "",
                addresses: [],
              },
              preferences: {
                newsletter: false,
                notifications: true,
              },
              cart: [],
              wishlist: [],
              orders: [],
            };

            const docRef = await adminDb.collection("users").add(newUser);
            user.id = docRef.id;
          } else {
            user.id = existingUser.docs[0].id;
          }
        } catch (error) {
          console.error("OAuth user creation error:", error);
          return false;
        }
      }
      return true;
    },
    async session({ session, token }) {
      // Use config implementation first to set basic props from token
      if (authConfig.callbacks?.session) {
        session = await authConfig.callbacks.session({ session, token } as any);
      }

      // Attempt to refresh role from DB if possible, but fallback gracefully if DB fails (though this runs on server, so it should be fine)
      try {
        if (token.id) {
          const userDoc = await adminDb.collection("users").doc(token.id as string).get();
          if (userDoc.exists) {
            const dbRole = (userDoc.data()?.role as UserRole) || "user";
            // Update session with latest DB role
            (session.user as any).role = dbRole;
          }
        }
      } catch (error) {
        // Silent fail on DB error, keep token role
        console.error("Session refresh error:", error);
      }

      return session;
    }
  }
});
