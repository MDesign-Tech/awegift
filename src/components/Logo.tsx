import { logo } from "@/assets";
import Link from "next/link";
import Image from "next/image";
import React from "react";

const Logo = () => {
  return (
    <Link href={"/"}>
      <Image
        src={logo}
        alt="logo"
        width={200}
        height={80}
        className="w-full h-full object-contain"
      />
    </Link>
  );
};

export default Logo;