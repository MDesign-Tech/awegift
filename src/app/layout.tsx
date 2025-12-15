import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { UserSyncProvider } from "@/components/UserSyncProvider";
import StateProvider from "@/components/auth/StateProvider";
import NotificationProvider from "@/components/NotificationProvider";
import { NetworkProvider } from "@/contexts/NetworkContext";
import NetworkStatus from "@/components/NetworkStatus";

export const metadata: Metadata = {
  title: "AweGift - Multipurpose eCommerce website",
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
        <NetworkProvider>
          <NetworkStatus />
          <StateProvider>
            <AuthProvider>
              <UserSyncProvider>
                <CurrencyProvider>
                  <NotificationProvider>{children}</NotificationProvider>
                </CurrencyProvider>
              </UserSyncProvider>
            </AuthProvider>
          </StateProvider>
        </NetworkProvider>
      </body>
    </html>
  );
}