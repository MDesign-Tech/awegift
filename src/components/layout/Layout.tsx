"use client";
import { persistor, store } from "@/redux/store";
import { SessionProvider } from "next-auth/react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import MainLoader from "../MainLoader";
import { UserSyncProvider } from "../UserSyncProvider";
import { usePathname } from "next/navigation";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const isPublicCatalogRoute =
    pathname === "/" ||
    pathname === "/products" ||
    pathname.startsWith("/products/") ||
    pathname === "/categories";

  return (
    <SessionProvider>
      <Provider store={store}>
        <PersistGate
          loading={isPublicCatalogRoute ? children : <MainLoader />}
          persistor={persistor}
        >
          <UserSyncProvider>{children}</UserSyncProvider>
        </PersistGate>
      </Provider>
    </SessionProvider>
  );
};

export default Layout;
