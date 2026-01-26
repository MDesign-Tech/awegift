// src/lib/auth.ts

import { NextAuthOptions, getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { adminDb } from "./firebase/admin";
import { compare } from "bcryptjs";
import { UserRole } from "./rbac/roles";
import crypto from "crypto";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
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
      async authorize(credentials, request) {
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

          let isValidPassword = false;
          let is2FAVerified = false;

          if (credentials.password === "2FA_VERIFIED") {
            // Special case: 2FA has been verified, skip password and 2FA checks
            isValidPassword = true;
            is2FAVerified = true;
          } else {
            isValidPassword = await compare(credentials.password, user.password);
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
          }

          // Check if 2FA is enabled (skip if already verified via special password)
          if (!is2FAVerified && user.twoFactorEnabled && user.twoFactorSecret) {
            // Generate temporary token for 2FA verification
            const tempToken = crypto.randomBytes(32).toString("hex");
            const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

            // Store temp token in user doc
            await userDoc.ref.update({
              temp2FAToken: tempToken,
              temp2FATokenExpires: expiresAt,
            });

            // Throw error to indicate 2FA required
            throw new Error("2FA_REQUIRED:" + tempToken);
          }

          // Extract device and browser info from user agent
          const userAgent = request?.headers?.["user-agent"] || "unknown";
          const ip = request?.headers?.["x-forwarded-for"]?.split(",")[0] ||
                    request?.headers?.["x-real-ip"] ||
                    "unknown";

          // Simple device/browser detection
          const isMobile = /mobile|android|iphone|ipad|ipod/i.test(userAgent);
          const device = isMobile ? "mobile" : "desktop";

          let browser = "unknown";
          if (/chrome/i.test(userAgent)) browser = "Chrome";
          else if (/firefox/i.test(userAgent)) browser = "Firefox";
          else if (/safari/i.test(userAgent)) browser = "Safari";
          else if (/edge/i.test(userAgent)) browser = "Edge";
          else if (/opera/i.test(userAgent)) browser = "Opera";

          // Get existing sessions
          const existingSessions = user.loginSessions || [];

          // Check if there's an existing non-revoked session for the same device and browser
          const existingSessionIndex = existingSessions.findIndex((s: any) =>
            !s.revoked && s.device === device && s.browser === browser
          );

          let sessionId: string;
          let updatedSessions: any[];

          if (existingSessionIndex !== -1) {
            // Update existing session
            existingSessions[existingSessionIndex].timestamp = new Date().toISOString();
            existingSessions[existingSessionIndex].ip = ip;
            existingSessions[existingSessionIndex].userAgent = userAgent;
            sessionId = existingSessions[existingSessionIndex].id;
            updatedSessions = existingSessions;
          } else {
            // Create new session
            sessionId = crypto.randomUUID();
            const loginSession = {
              id: sessionId,
              ip,
              userAgent,
              device,
              browser,
              timestamp: new Date().toISOString(),
              revoked: false,
            };
            updatedSessions = [loginSession, ...existingSessions].slice(0, 50); // Keep last 50
          }

          await userDoc.ref.update({
            loginAttempts: 0,
            lockUntil: null,
            lastLogin: new Date().toISOString(),
            loginSessions: updatedSessions,
          });

          return {
            id: userDoc.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role || "user",
            sessionId,
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
        token.sessionId = (user as any).sessionId;
      }

      // Fetch fresh user data from Firestore to sync role changes
      if (token.id) {
        try {
          const userDoc = await adminDb.collection("users").doc(token.id).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            token.role = userData?.role || "user";
            token.name = userData?.name || token.name;
            token.email = userData?.email || token.email;
            token.image = userData?.image || token.image;
          }
        } catch (error) {
          console.error("Error fetching fresh user data:", error);
          // Fall back to existing token data
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        // Check if session is revoked
        if (token.id && (token as any).sessionId) {
          try {
            const userDoc = await adminDb.collection("users").doc(token.id).get();
            if (userDoc.exists) {
              const userData = userDoc.data();
              const sessions = userData?.loginSessions || [];
              const currentSession = sessions.find((s: any) => s.id === (token as any).sessionId);
              if (currentSession?.revoked) {
                // Session is revoked, throw to invalidate
                throw new Error("Session revoked");
              }
            }
          } catch (error) {
            console.error("Error checking session revocation:", error);
            throw error;
          }
        }

        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.emailVerified = token.emailVerified as boolean;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image = token.image as string;
        (session.user as any).sessionId = (token as any).sessionId;
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
              loginSessions: [],
            });
          } else {
            // Update last login for existing OAuth user
            const userDoc = existingUser.docs[0];
            await userDoc.ref.update({
              lastLogin: new Date().toISOString(),
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
    },
    async signOut({ token }) {
      // Mark the session as revoked
      if (token?.id && (token as any).sessionId) {
        try {
          const userDoc = await adminDb.collection("users").doc(token.id).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            const sessions = userData?.loginSessions || [];
            const sessionIndex = sessions.findIndex((s: any) => s.id === (token as any).sessionId);
            if (sessionIndex !== -1) {
              sessions[sessionIndex].revoked = true;
              sessions[sessionIndex].revokedAt = new Date().toISOString();
              await userDoc.ref.update({
                loginSessions: sessions,
              });
            }
          }
        } catch (error) {
          console.error("Error revoking session on sign out:", error);
        }
      }
    },
  },
};