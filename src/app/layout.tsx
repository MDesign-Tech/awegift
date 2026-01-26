import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "../components/Providers";
import WhatsAppButton from "../components/WhatsAppButton";

export const metadata: Metadata = {
  title: "AweGift - Multipurpose eCommerce website",
  description: "Test application for education purpose",
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