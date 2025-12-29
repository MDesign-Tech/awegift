"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { UserSyncProvider } from "@/components/UserSyncProvider";
import StateProvider from "@/components/auth/StateProvider";
import { NotificationProvider } from "@/components/NotificationProvider";
import { NetworkProvider } from "@/contexts/NetworkContext";
import NetworkStatus from "@/components/NetworkStatus";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";



export default function Providers({ children }: { children: React.ReactNode }) {
  const [currentScope, setCurrentScope] = useState<any>("personal");
  const pathname = usePathname();

  const determineScope = () => {
    if (pathname.includes("/dashboard")) {
      setCurrentScope("admin");
    } else {
      setCurrentScope("personal");
    }
  };

  useEffect(() => {
    determineScope();
  }, [pathname]);

  return (
    <SessionProvider>
      <NetworkProvider>
        <NetworkStatus />
        <StateProvider>
          <AuthProvider>
            <UserSyncProvider>
              <CurrencyProvider>
                <NotificationProvider scope={currentScope}>
                  {children}
                  <Toaster
                    position="bottom-right"
                    toastOptions={{
                      className: '!bg-gray-900 !text-white !border-0',
                      style: {
                        background: '#000000',
                        color: '#ffffff',
                        border: 'none',
                      },
                      success: {
                        style: {
                          borderBottom: '2px solid #10b981', // green-500
                        },
                      },
                      error: {
                        style: {
                          borderBottom: '2px solid #ef4444', // red-500
                        },
                      },
                      loading: {
                        style: {
                          borderBottom: '2px solid #3b82f6', // blue-500
                        },
                      },
                    }}
                  />
                </NotificationProvider>
              </CurrencyProvider>
            </UserSyncProvider>
          </AuthProvider>
        </StateProvider>
      </NetworkProvider>
    </SessionProvider>
  );
}