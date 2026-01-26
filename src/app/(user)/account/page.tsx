import AccountClient from "@/components/account/AccountClient";
import { generateSEO } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = generateSEO({
  title: "Account",
  description: "Manage your account settings and preferences.",
  noindex: true,
  nofollow: true,
  url: "/account",
});

export default function AccountPage() {
  return (
      <AccountClient />
  );
}
