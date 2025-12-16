import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { UserData } from "../../type";

export function useCurrentUser(): {
  user: UserData | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  userId: string | null;
  userRole: string;
} {
  const userInfo = useSelector((state: RootState) => state.aweGift.userInfo);

  return {
    user: userInfo,
    isAdmin: userInfo?.role === "admin",
    isAuthenticated: !!userInfo,
    userId: userInfo?.id || null,
    userRole: userInfo?.role || "user",
  };
}
