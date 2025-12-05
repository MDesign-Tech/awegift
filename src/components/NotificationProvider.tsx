"use client";

import { useState } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationPopdown from "./NotificationPopdown";

const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { newNotification, clearNewNotification } = useNotifications();
  const [notificationModal, setNotificationModal] = useState<any>(null);

  const handleViewNotification = (notificationId: string) => {
    // Here you could fetch the full notification details or navigate to notifications page
    // For now, just close the popdown
    clearNewNotification();
  };

  return (
    <>
      {children}
      <NotificationPopdown
        notification={newNotification}
        onClose={clearNewNotification}
        onView={handleViewNotification}
      />
    </>
  );
};

export default NotificationProvider;