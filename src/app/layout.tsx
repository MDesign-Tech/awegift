import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "../components/Providers";
import WhatsAppButton from "../components/WhatsAppButton";
import { generateSEO } from "@/lib/seo";

const baseMetadata = generateSEO({
  title: "AweGift - Online Showroom for Creative Personalised Products  & Solutions",
  description:
    "Explore AweGift, your online showroom for personalized products, custom printing, branding materials, packaging, promotional products, corporate supplies, event essentials, creative crafts, and more.",

  keywords: [
    "AweGift",
    "AweeGift",
    "ecommerce",
    "online shopping",
    "online showroom",
    "online marketplace",
    "custom products",
    "personalized products",
    "printing services",
    "digital printing",
    "large format printing",
    "branding materials",
    "business branding",
    "promotional materials",
    "promotional products",
    "corporate merchandise",
    "corporate gifts",
    "custom packaging",
    "packaging solutions",
    "event products",
    "wedding products",
    "invitations",
    "signage",
    "banners",
    "awards and trophies",
    "wooden crafts",
    "wooden decorations",
    "custom ornaments",
    "wall art",
    "home decorations",
    "custom accessories",
    "personalized gifts",
    "business supplies",
    "custom merchandise",
    "bulk orders",
    "online product customization",
    "AweGift Rwanda",
    "online shopping Rwanda",
    "custom products Rwanda",
    "printing and branding Rwanda",
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
  width: "device-width",
  initialScale: 1.0,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
        <WhatsAppButton />
      </body>
    </html>
  );
}
