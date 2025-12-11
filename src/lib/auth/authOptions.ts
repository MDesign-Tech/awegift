import { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../../../firebase";
import { UserRole } from "@/lib/rbac/roles";
import { FirestoreUser } from "@/lib/firebase/userService";

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    Credentials({
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
          // Add timeout to prevent hanging on Firestore connection issues
          const authOperation = async () => {
            // Query user from Firestore
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("email", "==", credentials.email));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
              return null;
            }

            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();

            // Verify password
            const isPasswordValid = await bcrypt.compare(
              credentials.password as string,
              userData.password || ""
            );

            if (!isPasswordValid) {
              return null;
            }

            return {
              id: userDoc.id,
              email: userData.email,
              name: userData.name,
              image: userData.image || null,
              role: userData.role || "user",
            };
          };

          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Firestore timeout")), 15000)
          );

          return await Promise.race([authOperation(), timeoutPromise]) as any;
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  debug: process.env.NODE_ENV === "development",
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Handle OAuth providers (Google, GitHub)
      if (account?.provider === "google" || account?.provider === "github") {
        try {
          // Add timeout to prevent hanging on Firestore connection issues
          const firestoreOperation = async () => {
            // Check if user already exists in Firestore
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("email", "==", user.email));
            const querySnapshot = await getDocs(q);

            let userId = null;

            // If user doesn't exist, create them in Firestore
            if (querySnapshot.empty && user.email) {
              const docRef = await addDoc(usersRef, {
                name: user.name || "",
                email: user.email,
                image: user.image || "",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                emailVerified: true, // OAuth emails are verified by the provider
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
              });
              userId = docRef.id;
            } else {
              // User exists, get their ID
              userId = querySnapshot.docs[0].id;
            }

            return userId;
          };

          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Firestore timeout")), 15000)
          );

          const userId = await Promise.race([firestoreOperation(), timeoutPromise]) as string;

          // Store the Firestore document ID for later use
          user.id = userId;
        } catch (error) {
          console.error("Error handling OAuth user:", error);
          // Don't prevent sign-in, just log the error
          // OAuth should still work even if Firestore write fails
          // Generate a fallback ID for the user
          user.id = user.email ? `oauth_${user.email.replace(/[^a-zA-Z0-9]/g, "_")}` : `oauth_${Date.now()}`;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // On first sign in, user object is available
      if (user) {
        token.id = user.id || token.sub || `user_${Date.now()}`;
        token.role = user.role || "user"; // Use role from user object (set in authorize for credentials)
        token.email = user.email;
        if (user.image) {
          token.picture = user.image;
        }
      }

      // Ensure we always have an ID for the token
      if (!token.id) {
        if (token.sub) {
          token.id = token.sub;
        } else if (token.email) {
          token.id = `temp_${token.email.replace(/[^a-zA-Z0-9]/g, "_")}`;
        }
      }

      // Always fetch the latest role from database to keep token up to date
      if (token.id) {
        try {
          // Add timeout to prevent hanging on Firestore connection issues
          const userDocPromise = getDoc(doc(db, "users", token.id as string));
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Firestore timeout")), 15000)
          );

          const userDoc = await Promise.race([userDocPromise, timeoutPromise]) as any;
          if (userDoc.exists()) {
            const userData = userDoc.data();
            token.role = (userData.role as UserRole) || "user";
          }
        } catch (error) {
          console.error("Error fetching user role for token:", error);
          // Keep existing role or default - don't fail authentication
          if (!token.role) {
            token.role = "user";
          }
        }
      } else {
        // Ensure we always have a role
        if (!token.role) {
          token.role = "user";
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = (token.id as string) || (token.sub as string);
        session.user.email = token.email as string;

        // Fetch the latest user data from Firestore to get the correct role
        try {
          // Add timeout to prevent hanging on Firestore connection issues
          const userDocPromise = getDoc(doc(db, "users", session.user.id));
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Firestore timeout")), 15000)
          );

          const userDoc = await Promise.race([userDocPromise, timeoutPromise]) as any;
          if (userDoc.exists()) {
            const userData = userDoc.data();
            session.user.role = (userData.role as UserRole) || "user";
            session.user.name = userData.name || session.user.name;
            session.user.image = userData.image || (token.picture as string);
          } else {
            session.user.role = (token.role as UserRole) || "user";
          }
        } catch (error) {
          console.error("Error fetching user data from Firestore:", error);
          // Don't fail session creation, use token data as fallback
          session.user.role = (token.role as UserRole) || "user";
        }

        // Ensure image is properly passed through if not from Firestore
        if (token.picture && !session.user.image) {
          session.user.image = token.picture as string;
        }
      }

      return session;
    },
  },
};
