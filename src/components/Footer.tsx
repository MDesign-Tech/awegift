import Container from "./Container";
import { logo } from "@/assets";
import SocialLink from "./SocialLink";
import Title from "./Title";
import { FaFacebook } from "react-icons/fa";
import { InfoNavigation, navigation } from "@/constants";
import Link from "next/link";
import Image from "next/image";
import { GoDotFill } from "react-icons/go";
import { BsEnvelopeAt } from "react-icons/bs";
import { GrLocation } from "react-icons/gr";

const Footer = () => {
  return (
    <div className="bg-light-bg py-10 lg:py-20">
      <Container className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="flex flex-col items-start gap-y-5">
          <Link href={"/"}>
            <Image src={logo} alt="logo" width={112} height={40} />
          </Link>
          <p>Unique • Creative • Memorable</p>
          <SocialLink />
        </div>
        <div>
          <Title>Shop</Title>
          <div className="mt-3 flex flex-col gap-y-2">
            {navigation?.map((item) => (
              <Link
                key={item?.title}
                href={item?.href}
                className="flex items-center gap-x-2 text-gray-700 hover:text-theme-color duration-200 font-medium"
              >
                <GoDotFill size={10} />
                {item?.title}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <Title>Information</Title>
          <div className="mt-3 flex flex-col gap-y-2">
            {InfoNavigation?.map((item) => (
              <Link
                key={item?.title}
                href={item?.href}
                className="flex items-center gap-x-2 text-gray-700 hover:text-theme-color duration-200 font-medium"
              >
                <GoDotFill size={10} />
                {item?.title}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <Title>Talk to Us</Title>
          <div className="mt-3">
            <div>
              <p className="text-sm">Got Questions? Call us</p>
              <Title>+250 781 990 310</Title>
            </div>
            <div className="mt-3">
              <p className="text-base flex items-center gap-x-3 text-gray-600">
                <BsEnvelopeAt /> support@awegift.com
              </p>
              <p className="text-base flex items-center gap-x-3 text-gray-600">
                <GrLocation />
                Kigali, Rwanda
              </p>
            </div>
          </div>
        </div>
      </Container>
      <div className="border-t border-gray-200 mt-8 pt-6">
        <Container className="flex flex-col gap-y-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-gray-600">
            © 2026 AweGift. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600">
            <Link
              href="/privacy"
              className="hover:text-theme-color transition-colors duration-200"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="hover:text-theme-color transition-colors duration-200"
            >
              Terms
            </Link>
          </div>
        </Container>
      </div>
    </div>
  );
};

export default Footer;
