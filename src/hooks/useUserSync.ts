import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useDispatch, useSelector } from "react-redux";
import { addUser, removeUser } from "@/redux/aweGiftSlice";
import { fetchUserFromFirestore } from "@/lib/firebase/userService";
import type { RootState } from "@/redux/store";

export function useUserSync() {
  const { data: session, status, update: updateSession } = useSession();
  const dispatch = useDispatch();
  const userInfo = useSelector((state: RootState) => state.aweGift.userInfo);

  const refreshUserData = async () => {
    if (session?.user?.id) {
      try {
        const firestoreUser = await fetchUserFromFirestore(session.user.id);
        if (firestoreUser) {
          dispatch(addUser(firestoreUser));
          // Also update session if role changed
          if (firestoreUser.role !== session.user.role) {
            await updateSession({
              ...session,
              user: {
                ...session.user,
                role: firestoreUser.role,
              },
            });
          }
        }
      } catch (error) {
        console.error("Error refreshing user data:", error);
      }
    }
  };

  useEffect(() => {
    const syncUserData = async () => {
      if (status === "loading") return;

      if (session?.user?.id) {
        // If we don't have user data in store, the session ID doesn't match, or the role changed
        if (!userInfo || userInfo.id !== session.user.id || userInfo.role !== session.user.role) {
          try {
            const firestoreUser = await fetchUserFromFirestore(session.user.id);
            if (firestoreUser) {
              dispatch(addUser(firestoreUser));
            } else {
              // If no Firestore data, create minimal user from session
              const sessionUser = {
                id: session.user.id,
                name: session.user.name || "",
                email: session.user.email || "",
                image: session.user.image || "",
                role: session.user.role || "user",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                emailVerified: true,
                profile: {
                  firstName: session.user.name?.split(" ")[0] || "",
                  lastName:
                    session.user.name?.split(" ").slice(1).join(" ") || "",
                  phone: "",
                  addresses: [],
                },
                preferences: {
                  newsletter: false,
                  notifications: true,
                },
                cart: [],
                wishlist: [],
              };
              dispatch(addUser(sessionUser));
            }
          } catch (error) {
            console.error("Error syncing user data:", error);
          }
        }
      } else if (status === "unauthenticated") {
        // Clear user data when logged out
        if (userInfo) {
          dispatch(removeUser());
        }
      }
    };

    syncUserData();
  }, [session, status, dispatch, userInfo?.id, userInfo?.role]);

  return {
    user: userInfo,
    session,
    isLoading: status === "loading",
    isAuthenticated: !!session?.user,
    refreshUserData,
  };
}
