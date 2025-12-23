'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { NotificationData } from '../../type';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [newNotification, setNewNotification] = useState<NotificationData | null>(null);
  const { data: session } = useSession();

  const fetchNotifications = async () => {
    if (!session?.user?.id) return;
    try {
      const response = await fetch(`/api/user/notifications?t=${Date.now()}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
        setUnreadCount(data.notifications.filter((n: NotificationData) => !n.isRead).length);
      } else {
        console.error('Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [session?.user?.id]);

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/user/notifications/${notificationId}`, {
        method: 'PATCH',
      });
      if (response.ok) {
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } else {
        console.error('Failed to mark as read');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    // Not implemented via API yet
    console.log('Delete not implemented');
  };

  const markAllAsRead = async () => {
    // Not implemented via API yet
    console.log('Mark all not implemented');
  };

  const clearNewNotification = () => {
    setNewNotification(null);
  };

  const refetch = () => {
    fetchNotifications();
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    deleteNotification,
    markAllAsRead,
    refetch,
    newNotification,
    clearNewNotification,
  };
};