import { useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useDispatch, useSelector } from "react-redux";
import { addUser, removeUser } from "@/redux/aweGiftSlice";
import { fetchUserFromFirestore } from "@/lib/firebase/clientUser";
import type { RootState } from "@/redux/store";

export function useUserSync() {
  const { user, loading } = useAuth();
  const dispatch = useDispatch();
  const userInfo = useSelector((state: RootState) => state.aweGift.userInfo);

  const refreshUserData = async () => {
    if (user?.id) {
      try {
        const firestoreUser = await fetchUserFromFirestore(user.id);
        if (firestoreUser) {
          dispatch(addUser(firestoreUser));
        }
      } catch (error) {
        console.error("Error refreshing user data:", error);
      }
    }
  };

  useEffect(() => {
    const syncUserData = async () => {
      if (loading) return;

      if (user?.id) {
        // If we don't have user data in store, the session ID doesn't match, or the role changed
        if (!userInfo || userInfo.id !== user.id || userInfo.role !== (user as any).role) {
          try {
            const firestoreUser = await fetchUserFromFirestore(user.id);
            if (firestoreUser) {
              dispatch(addUser(firestoreUser));
            } else {
              // If no Firestore data, create minimal user from auth user
              const authUser = {
                id: user.id,
                name: user.name || "",
                email: user.email || "",
                image: user.image || "",
                role: (user as any).role || "user",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                emailVerified: true,
                profile: {
                  firstName: user.name?.split(" ")[0] || "",
                  lastName:
                    user.name?.split(" ").slice(1).join(" ") || "",
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
              dispatch(addUser(authUser));
            }
          } catch (error) {
            console.error("Error syncing user data:", error);
          }
        }
      } else {
        // Clear user data when logged out
        if (userInfo) {
          dispatch(removeUser());
        }
      }
    };

    syncUserData();
  }, [user, loading, dispatch, userInfo?.id, userInfo?.role]);

  return {
    user: userInfo,
    session: user,
    isLoading: loading,
    isAuthenticated: !!user,
    refreshUserData,
  };
}
