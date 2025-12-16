"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { UserSyncProvider } from "@/components/UserSyncProvider";
import StateProvider from "@/components/auth/StateProvider";
import NotificationProvider from "@/components/NotificationProvider";
import { NetworkProvider } from "@/contexts/NetworkContext";
import NetworkStatus from "@/components/NetworkStatus";


export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <NetworkProvider>
        <NetworkStatus />
        <StateProvider>
          <AuthProvider>
            <UserSyncProvider>
              <CurrencyProvider>
                <NotificationProvider>
                  {children}
                  <Toaster position="bottom-right" />
                </NotificationProvider>
              </CurrencyProvider>
            </UserSyncProvider>
          </AuthProvider>
        </StateProvider>
      </NetworkProvider>
    </SessionProvider>
  );
}