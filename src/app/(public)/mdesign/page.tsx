import { generateSEO } from "@/lib/seo";
import type { Metadata } from "next";
import MDesignClient from "./MDesignClient";

export const metadata: Metadata = generateSEO({
  title: "MDesign Services",
  description:
    "MDesign by AweGift: Visual Creation, Event Management, and Tech Solutions with creative dark mode and animation.",
  url: "/mdesign",
});

export default function MDesignPage() {
  return <MDesignClient />;
}
