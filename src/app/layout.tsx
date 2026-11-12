import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "../components/Providers";
import WhatsAppButton from "../components/WhatsAppButton";
import { generateSEO, SITE_URL } from "@/lib/seo";

const baseMetadata = generateSEO({
  title: "AweGift | Personalized Products, Printing & Branding in Rwanda",
  description:
    "Discover AweGift, your online showroom for personalized products, custom printing, branding materials, packaging, promotional products, corporate gifts and supplies in Rwanda. Explore products and order online.",

  keywords: [
    "AweGift",
    "personalized products Rwanda",
    "custom printing Rwanda",
    "branding materials Rwanda",
    "promotional products",
    "corporate gifts Rwanda",
    "custom packaging",
    "Rwandan business supplies",
  ],
  image: "/og-image.svg",
  url: "/",
});

export const metadata: Metadata = {
  ...baseMetadata,
  metadataBase: new URL(SITE_URL),
  applicationName: "AweGift",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
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
