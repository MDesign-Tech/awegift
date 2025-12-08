import Container from "../Container";
import Link from "next/link";
import { navigation } from "@/constants";
import { auth } from "../../../auth";
import SignOutButton from "./SignOutButton";
import { FaWhatsapp } from "react-icons/fa";

const BottomHeader = async () => {
  const session = await auth();

  return (
    <div className="border-b border-b-gray-400">
      <Container className="flex items-center justify-between py-1">
        <div className="text-xs md:text-sm font-medium flex items-center gap-5">
          {navigation?.map((item) => (
            <Link key={item?.title} href={item?.href}>
              {item?.title}
            </Link>
          ))}
          <SignOutButton session={session} />
        </div>
        <p className="text-xs text-gray-400 font-medium hidden md:inline-flex items-center gap-3">
          Tel: <span className="text-[#ed4c07]">+250 781 990 310</span>
          <span className="text-gray-400">|</span>
          <a
            href="https://wa.me/250781990310?text=Hello%20I%20would%20like%20to%20inquire%20about%20your%20products"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[#25D366] transition-colors duration-200"
          >
            <FaWhatsapp className="text-lg" />
            Whatsapp Us
          </a>
        </p>
      </Container>
    </div>
  );
};

export default BottomHeader;
