import { logo } from "@/assets";
import Link from "next/link";
import React from "react";

const Logo = () => {
  return (
    <Link href={"/"}>
      <img src={logo} alt="logo" className="w-auto h-8 object-contain" />
    </Link>
  );
};

export default Logo;
