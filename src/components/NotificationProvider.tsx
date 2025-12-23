"use client";

import NotificationPopup from "@/components/notifications/NotificationPopup";
import { NotificationProvider as ContextProvider } from "@/lib/notification/provider";

const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <ContextProvider>
      {children}
      <NotificationPopup showSequentially={true} autoDismissTime={5000} />
    </ContextProvider>
  );
};

export default NotificationProvider;