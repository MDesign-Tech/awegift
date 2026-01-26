import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "../components/Providers";
import WhatsAppButton from "../components/WhatsAppButton";
import { generateSEO } from "@/lib/seo";

const baseMetadata = generateSEO({
  title: "AweGift - Multipurpose eCommerce website",
  description: "Discover unique and thoughtful gifts at AweGift. Shop personalized presents, custom gifts, luxury items, and more with fast delivery and secure checkout.",
  keywords: [
    "ecommerce",
    "shopping",
    "online store",
    "gifts",
    "personalized gifts",
    "custom presents",
    "luxury gifts",
    "birthday gifts",
    "anniversary gifts",
    "wedding gifts",
    "corporate gifts",
    "online shopping",
    "gifts",
    "personalized gifts",
    "luxury presents",
    "custom gifts",
    "birthday gifts",
    "fast shipping",
    "unique gifts",
    "gift shopping",
    "present ideas",
    "customized gifts",
    "premium gifts",
    "gift delivery",
    "secure checkout",
    "gift cards",
    "holiday gifts",
    "special occasion gifts",
    "bulk gifts",
    "business gifts",
  ],
  image: "/logo.png",
  url: "/",
});

export const metadata: Metadata = {
  ...baseMetadata,
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  verification: {
    google: "google8d5870e68a4b085f.html",
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
        <WhatsAppButton />
      </body>
    </html>
  );
}