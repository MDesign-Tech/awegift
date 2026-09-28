import { UserData } from "../../../type";

// Browser sessions are authenticated by NextAuth, not Firebase Auth. Reading
// Firestore directly here would make request.auth null and fail Firestore rules.
// The API route verifies the NextAuth session and reads Firestore with Admin SDK.
export async function fetchUserFromFirestore(
  userId: string
): Promise<UserData | null> {
  try {
    const response = await fetch("/api/user/profile", { cache: "no-store" });
    if (!response.ok) {
      return null;
    }

    const userData = await response.json();
    // The endpoint returns the account associated with the current NextAuth session.
    // Keep this guard in case a stale browser session supplies a different user ID.
    if (userData.id !== userId) return null;

    return userData as UserData;
  } catch (error) {
    console.error("Error fetching the current user profile:", error);
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
