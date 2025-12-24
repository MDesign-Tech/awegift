import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { compare } from "bcryptjs";
import { adminDb } from "@/lib/firebase/admin";
import { authConfig } from "./auth.config";
import { UserRole } from "@/lib/rbac/roles";

const config = {
  ...authConfig,
  session: {
    strategy: "jwt" as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
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
        if (
          !credentials?.email ||
          !credentials?.password ||
          typeof credentials.email !== "string" ||
          typeof credentials.password !== "string"
        ) {
          return null;
        }

        const snapshot = await adminDb
          .collection("users")
          .where("email", "==", credentials.email)
          .limit(1)
          .get();

        if (snapshot.empty) return null;

        const doc = snapshot.docs[0];
        const user = doc.data();

        if (!user.password) return null;

        const isValid = await compare(credentials.password, user.password);
        if (!isValid) return null;

        return {
          id: doc.id,
          email: user.email,
          name: user.name,
          image: user.image || null,
          role: user.role || "user",
        };
      },
    })
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }: any) {
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
    async session({ session, token }: any) {
      // Use config implementation first to set basic props from token
      if (authConfig.callbacks?.session) {
        session = await authConfig.callbacks.session({ session, token } as any);
      }

      return session;
    }
  }
};

export const { handlers, auth } = NextAuth(config);
