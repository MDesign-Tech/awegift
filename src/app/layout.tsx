import type { Metadata, Viewport } from "next";
import "./globals.css";
import AuthProvider from "@/components/auth/AuthProvider";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { UserSyncProvider } from "@/components/UserSyncProvider";
import PurchaseWidget from "@/components/PurchaseWidget";
import StateProvider from "@/components/auth/StateProvider";

export const metadata: Metadata = {
  title: "Shofy - Multipurpose eCommerce website",
  description: "Test application for education purpose",
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
        <StateProvider>
          <AuthProvider>
            <UserSyncProvider>
              <CurrencyProvider>{children}</CurrencyProvider>
              <PurchaseWidget />
            </UserSyncProvider>
          </AuthProvider>
        </StateProvider>
      </body>
    </html>
  );
}
