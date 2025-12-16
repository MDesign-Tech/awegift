import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import type { NextAuthOptions } from "next-auth";
import { compare } from "bcryptjs";
import { adminDb } from "@/lib/firebase/admin";
import { UserRole } from "@/lib/rbac/roles";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
  jwt: {
    maxAge: 60 * 60 * 24 * 7,
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
        if (!credentials?.email) return null;

        const snapshot = await adminDb
          .collection("users")
          .where("email", "==", credentials.email)
          .limit(1)
          .get();

        if (snapshot.empty) return null;

        const doc = snapshot.docs[0];
        const user = doc.data();

        // If password is "authenticated", skip password check (used for custom login)
        if (credentials.password !== "authenticated") {
          if (!credentials.password) return null;
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
      },
    }),
  ],
  callbacks: {
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      // Check if user still exists in database
      const userDoc = await adminDb.collection("users").doc(token.id as string).get();
      if (!userDoc.exists) {
        // User has been deleted, invalidate session
        return { ...session, user: null } as any;
      }

      // User exists, set session data
      (session.user as any).id = token.id as string;
      (session.user as any).role = (userDoc.data()?.role as UserRole) || "user";
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);