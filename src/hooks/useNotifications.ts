"use client";

import { useState, useEffect } from "react";
import { collection, query, where, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useSession } from "next-auth/react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  quoteId?: string;
  createdAt: Timestamp;
}

interface NotificationPopdown {
  id: string;
  title: string;
  message: string;
  type: string;
}

export const useNotifications = () => {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [newNotification, setNewNotification] = useState<NotificationPopdown | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    const notificationsRef = collection(db, "notifications");
    const q = query(
      notificationsRef,
      where("userId", "==", session.user.id),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationData: Notification[] = [];
      let hasNewNotification = false;
      let latestNotification: NotificationPopdown | null = null;

      snapshot.forEach((doc) => {
        const data = doc.data() as Omit<Notification, 'id'>;
        const notification: Notification = {
          id: doc.id,
          ...data,
        };
        notificationData.push(notification);
      });

      // Check for new notifications (only if we already have data)
      if (notifications.length > 0 && notificationData.length > notifications.length) {
        // Find the newest notification
        const sortedData = notificationData.sort((a, b) =>
          b.createdAt.toMillis() - a.createdAt.toMillis()
        );
        const newest = sortedData[0];

        // Check if it's unread and not already in our previous list
        const isNew = !notifications.some(n => n.id === newest.id) && !newest.read;

        if (isNew) {
          latestNotification = {
            id: newest.id,
            title: newest.title,
            message: newest.message,
            type: newest.type,
          };
          hasNewNotification = true;
        }
      }

      setNotifications(notificationData);
      setLoading(false);

      if (hasNewNotification && latestNotification) {
        setNewNotification(latestNotification);
        // Auto-clear after 4 seconds
        setTimeout(() => {
          setNewNotification(null);
        }, 4000);
      }
    }, (error) => {
      console.error("Error listening to notifications:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [session?.user?.id, notifications.length]);

  const clearNewNotification = () => {
    setNewNotification(null);
  };

  return {
    notifications,
    newNotification,
    loading,
    clearNewNotification,
  };
};