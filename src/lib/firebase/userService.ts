import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import { UserData } from "../../../type";

export async function fetchUserFromFirestore(
  userId: string
): Promise<UserData | null> {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));

    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        id: userId,
        ...userData,
      } as UserData;
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
