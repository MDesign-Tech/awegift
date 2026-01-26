import FAQClient from "@/components/FAQClient";
import { generateSEO } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = generateSEO({
  title: "Frequently Asked Questions",
  description: "Find answers to common questions about shopping with AweGift, including orders, shipping, returns, and more.",
  url: "/faqs",
});

export default function FAQsPage() {
  return <FAQClient />;
}
