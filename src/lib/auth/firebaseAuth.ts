import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  setPersistence,
  browserSessionPersistence,
  browserLocalPersistence,
  User,
  AuthError,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../../firebase";

const REMEMBER_ME_KEY = "firebase_remember_me_timestamp";
const REMEMBER_ME_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: string;
  // Additional Firestore data
  name?: string;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
  emailVerified?: boolean;
  provider?: string;
  profile?: {
    firstName: string;
    lastName: string;
    phone: string;
    addresses: any[];
  };
  preferences?: {
    newsletter: boolean;
    notifications: boolean;
  };
  cart?: any[];
  wishlist?: any[];
  orders?: any[];
}

class FirebaseAuthService {
  private authStateListeners: ((user: AuthUser | null) => void)[] = [];

  constructor() {
    this.initializeAuthStateListener();
  }

  private initializeAuthStateListener() {
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Check if remember me has expired
        const rememberMeTimestamp = localStorage.getItem(REMEMBER_ME_KEY);
        if (rememberMeTimestamp) {
          const timestamp = parseInt(rememberMeTimestamp);
          const now = Date.now();
          if (now - timestamp > REMEMBER_ME_DURATION) {
            // Remember me expired, sign out
            await this.signOut();
            this.notifyListeners(null);
            return;
          }
        }

        // Get user data from Firestore
        const userData = await this.getUserData(firebaseUser.uid);
        const authUser: AuthUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          role: userData?.role || "user",
          ...userData,
        };
        this.notifyListeners(authUser);
      } else {
        this.notifyListeners(null);
      }
    });
  }

  private async getUserData(uid: string) {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.error("Error fetching user data:", error);
      return null;
    }
  }

  private notifyListeners(user: AuthUser | null) {
    this.authStateListeners.forEach(listener => listener(user));
  }

  onAuthStateChanged(callback: (user: AuthUser | null) => void) {
    this.authStateListeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  async signInWithEmailAndPassword(email: string, password: string, rememberMe: boolean = false) {
    try {
      // Set persistence based on remember me
      if (rememberMe) {
        await setPersistence(auth, browserLocalPersistence);
        // Store timestamp for expiration check
        localStorage.setItem(REMEMBER_ME_KEY, Date.now().toString());
      } else {
        await setPersistence(auth, browserSessionPersistence);
        // Clear any existing remember me timestamp
        localStorage.removeItem(REMEMBER_ME_KEY);
      }

      const result = await signInWithEmailAndPassword(auth, email, password);
      return { user: result.user, error: null };
    } catch (error) {
      return { user: null, error: error as AuthError };
    }
  }

  async signInWithGoogle(rememberMe: boolean = false) {
    try {
      const provider = new GoogleAuthProvider();

      if (rememberMe) {
        await setPersistence(auth, browserLocalPersistence);
        localStorage.setItem(REMEMBER_ME_KEY, Date.now().toString());
      } else {
        await setPersistence(auth, browserSessionPersistence);
        localStorage.removeItem(REMEMBER_ME_KEY);
      }

      const result = await signInWithPopup(auth, provider);

      // Ensure user exists in Firestore
      await this.ensureUserInFirestore(result.user);

      return { user: result.user, error: null };
    } catch (error) {
      return { user: null, error: error as AuthError };
    }
  }

  async signInWithGithub(rememberMe: boolean = false) {
    try {
      const provider = new GithubAuthProvider();

      if (rememberMe) {
        await setPersistence(auth, browserLocalPersistence);
        localStorage.setItem(REMEMBER_ME_KEY, Date.now().toString());
      } else {
        await setPersistence(auth, browserSessionPersistence);
        localStorage.removeItem(REMEMBER_ME_KEY);
      }

      const result = await signInWithPopup(auth, provider);

      // Ensure user exists in Firestore
      await this.ensureUserInFirestore(result.user);

      return { user: result.user, error: null };
    } catch (error) {
      return { user: null, error: error as AuthError };
    }
  }

  private async ensureUserInFirestore(firebaseUser: User) {
    try {
      const userRef = doc(db, "users", firebaseUser.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        // Create user in Firestore
        const userData = {
          name: firebaseUser.displayName || "",
          email: firebaseUser.email,
          image: firebaseUser.photoURL || "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          emailVerified: firebaseUser.emailVerified,
          role: "user",
          provider: firebaseUser.providerData[0]?.providerId || "unknown",
          profile: {
            firstName: firebaseUser.displayName?.split(" ")[0] || "",
            lastName: firebaseUser.displayName?.split(" ").slice(1).join(" ") || "",
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

        await setDoc(userRef, userData);
      } else {
        // Update last login
        await updateDoc(userRef, {
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Error ensuring user in Firestore:", error);
    }
  }

  async signOut() {
    try {
      await firebaseSignOut(auth);
      localStorage.removeItem(REMEMBER_ME_KEY);
      return { error: null };
    } catch (error) {
      return { error: error as AuthError };
    }
  }

  getCurrentUser() {
    return auth.currentUser;
  }
}

export const firebaseAuth = new FirebaseAuthService();