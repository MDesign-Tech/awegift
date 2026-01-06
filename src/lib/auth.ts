import { NextAuthOptions, getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { adminDb } from "./firebase/admin";
import { compare } from "bcryptjs";
import { UserRole } from "./rbac/roles";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {

          // Find user in Firestore
          const usersRef = adminDb.collection("users");
          const querySnapshot = await usersRef
            .where("email", "==", credentials.email)
            .get();

          if (querySnapshot.empty) {
            return null;
          }

          const userDoc = querySnapshot.docs[0];
          const user = userDoc.data();

          // Check if email is verified
          if (!user.emailVerified) {
            throw new Error("Please verify your email before signing in.");
          }

          // Check if account is locked
          if (user.lockUntil && user.lockUntil > Date.now()) {
            throw new Error("Account is temporarily locked due to too many failed login attempts.");
          }

          // Verify password
          if (!user.password) {
            throw new Error("This account uses OAuth. Please sign in with Google.");
          }

          const isValidPassword = await compare(credentials.password, user.password);
          if (!isValidPassword) {
            // Increment login attempts
            const loginAttempts = (user.loginAttempts || 0) + 1;
            const updateData: any = { loginAttempts };

            if (loginAttempts >= 5) {
              updateData.lockUntil = Date.now() + 2 * 60 * 60 * 1000; // 2 hours
            }

            await userDoc.ref.update(updateData);
            throw new Error("Invalid email or password.");
          }

          // Reset login attempts on successful login
          await userDoc.ref.update({
            loginAttempts: 0,
            lockUntil: null,
            lastLogin: new Date().toISOString(),
          });

          return {
            id: userDoc.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role || "user",
          };
        } catch (error) {
          console.error("Auth error:", error);
          throw error;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      // Note: Fresh user data fetching disabled to prevent connection issues
      // User data is set during sign-in and should be sufficient
      // If role updates are needed, implement a separate mechanism

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.emailVerified = token.emailVerified as boolean;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      // For OAuth providers, ensure user exists in Firestore
      if (account?.provider === "google") {
        try {
          const usersRef = adminDb.collection("users");
          const existingUser = await usersRef.where("email", "==", user.email).get();

          if (existingUser.empty) {
            // Create user for OAuth
            await usersRef.add({
              name: user.name,
              email: user.email,
              image: user.image,
              role: "user",
              emailVerified: true,
              provider: account.provider,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
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
            });
          }
        } catch (error) {
          console.error("Error creating OAuth user:", error);
          return false;
        }
      }

      return true;
    },
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      // Log sign in events if needed
      console.log(`User ${user.email} signed in via ${account?.provider}`);
    },
    async signOut({ token }) {
      // Log sign out events if needed
      console.log(`User ${token?.email} signed out`);
    },
  },
};