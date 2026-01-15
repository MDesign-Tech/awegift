'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { NotificationData } from '../../type';
import { UserRole } from '@/lib/rbac/roles';

interface NotificationContextType {
  notifications: NotificationData[];
  unreadCount: number;
  markAsRead: (notificationId: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  deleteNotification: (notificationId: string) => Promise<boolean>;
  deleteAllNotifications: () => Promise<boolean>;
  refreshNotifications: () => Promise<void>;
  isLoading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
  scope?: 'admin' | 'personal'; // optional scope prop
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children, scope }) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session, status } = useSession();

  // Function to fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!session?.user || status !== 'authenticated') return;

    setIsLoading(true);

    try {
      const response = await fetch(`/api/notifications?scope=${scope}`);
      if (response.ok) {
        const data = await response.json();
        const notifications = data.notifications || [];
        setNotifications(notifications);
        setUnreadCount(notifications.filter((n: NotificationData) => !n.isRead).length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [session, status, scope]);

  // Fetch notifications when session is available
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchNotifications();
    } else if (status === 'unauthenticated') {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
    }
  }, [status, session, fetchNotifications]);


  const markAsRead = async (notificationId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  };

  const markAllAsRead = async (): Promise<boolean> => {
    if (!session?.user) return false;

    try {
      const res = await fetch(`/api/notifications`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope }),
      });

      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  };

  const deleteNotification = async (notificationId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  };

  const deleteAllNotifications = async (): Promise<boolean> => {
    if (!session?.user) return false;

    try {
      const notificationIds = notifications.map(n => n.id).filter(Boolean);
      if (notificationIds.length === 0) return true;

      const res = await fetch(`/api/notifications`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: notificationIds, scope }),
      });

      if (res.ok) {
        setNotifications([]);
        setUnreadCount(0);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      return false;
    }
  };


  const value: NotificationContextType = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    refreshNotifications: fetchNotifications,
    isLoading,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
