import BottomHeader from "./BottomHeader";
import MiddleHeader from "./MiddleHeader";
import TopHeader from "./TopHeader";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const Header = async () => {
  const freeShippingThreshold =
    process.env.NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD || "1000";
  const session = await getServerSession(authOptions);
  return (
    <header className="w-full bg-theme-white sticky top-0 z-49">
      {/* TopHeader */}
      <TopHeader freeShippingThreshold={freeShippingThreshold} />
      <div>
        {/* Middle Header */}
        <MiddleHeader session={session} />
        {/* BottomHeader */}
        <BottomHeader />
      </div>
    </header>
  );
};

export default Header;
