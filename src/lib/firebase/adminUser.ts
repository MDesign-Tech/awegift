import { UserData } from "../../../type";
import { adminDb } from "./admin";

export async function fetchUserFromFirestore(
  userId: string
): Promise<UserData | null> {
  
  try {
    const userDoc = await adminDb.collection("users").doc(userId).get();

    if (userDoc.exists) {
      const userData = userDoc.data();
      const fullUserData = {
        id: userId,
        ...userData,
      } as UserData;

      return fullUserData;
    }

    return null;
  } catch (error) {
    console.error("Error fetching user from Firestore:", error);
    return null;
  }
}

export async function getCurrentUserData(
  session: any
): Promise<UserData | null> {
  if (!session?.user?.id) {
    return null;
  }

  return await fetchUserFromFirestore(session.user.id);
}