import 'server-only';

import admin from 'firebase-admin';

// Lazy initialization to avoid build-time errors
let adminApp: admin.app.App | null = null;

function getAdminApp() {
  if (!adminApp) {
    if (admin.apps.length > 0) {
      adminApp = admin.apps[0];
    } else {
      if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
        throw new Error('Missing Firebase Admin environment variables');
      }

      const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      };

      try {
        adminApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      } catch (error) {
        console.error('Firebase Admin initialization error:', error);
        throw new Error('Failed to initialize Firebase Admin');
      }
    }
  }
  return adminApp;
}

// Export lazy-initialized instances
export const adminAuth = new Proxy({} as admin.auth.Auth, {
  get(target, prop) {
    const app = getAdminApp();
    if (!app) throw new Error('Failed to initialize Firebase Admin');
    const auth = app.auth();
    return (auth as any)[prop];
  }
});

export const adminDb = new Proxy({} as admin.firestore.Firestore, {
  get(target, prop) {
    const app = getAdminApp();
    if (!app) throw new Error('Failed to initialize Firebase Admin');
    const firestore = app.firestore();
    return (firestore as any)[prop];
  }
});

export const adminStorage = new Proxy({} as admin.storage.Storage, {
  get(target, prop) {
    const app = getAdminApp();
    if (!app) throw new Error('Failed to initialize Firebase Admin');
    const storage = app.storage();
    return (storage as any)[prop];
  }
});
