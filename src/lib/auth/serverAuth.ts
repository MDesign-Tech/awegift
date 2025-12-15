import { cookies } from 'next/headers';
import { admin } from './firebaseAdmin';

export async function getServerUser() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__session')?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(sessionCookie);
    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();

    if (userDoc.exists) {
      const userData = userDoc.data();
      return {
        id: decodedToken.uid,
        email: decodedToken.email,
        name: userData?.name,
        image: userData?.image,
        role: userData?.role || 'user',
      };
    }
    return null;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}