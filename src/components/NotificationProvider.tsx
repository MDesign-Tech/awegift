'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth as firebaseAuth, db } from '@/lib/firebase/firebaseClient';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { NotificationData } from '../../type';
import { UserRole } from '@/lib/rbac/roles';

interface NotificationContextType {
  notifications: NotificationData[];
  unreadCount: number;
  markAsRead: (notificationId: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  deleteNotification: (notificationId: string) => Promise<boolean>;
  isLoading: boolean;
  onAccountNotificationsChange: (
    userId: string,
    userRole: UserRole,
    callback: (notifications: NotificationData[]) => void
  ) => () => void;
  onAdminNotificationsChange: (
    callback: (notifications: NotificationData[]) => void
  ) => () => void;
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

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children, scope}) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(firebaseAuth, async (user) => {
      if (user) {
        setCurrentUserId(user.uid);
        // Get user role from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserRole((userDoc.data()?.role as UserRole) || 'user');
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
          setUserRole('user');
        }
      } else {
        setCurrentUserId(null);
        setUserRole(null);
        setNotifications([]);
        setUnreadCount(0);
        setIsLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Set up real-time listeners
  useEffect(() => {
    if (!currentUserId || !userRole) return;

    setIsLoading(true);
    let unsubscribe: (() => void) | undefined;

    if (scope === 'admin') {
      // Admin notifications listener
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('scope', '==', 'admin'),
        orderBy('createdAt', 'desc')
      );

      unsubscribe = onSnapshot(q, (snapshot) => {
        const notifications = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt,
        })) as NotificationData[];

        setNotifications(notifications);
        setUnreadCount(notifications.filter(n => !n.isRead).length);
        setIsLoading(false);
      }, (error) => {
        console.error('Error listening to admin notifications:', error);
        setIsLoading(false);
      });
    } else {
      // Personal notifications listener
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('recipientId', '==', currentUserId),
        where('recipientRole', '==', userRole),
        where('scope', '==', 'personal'),
        orderBy('createdAt', 'desc')
      );

      unsubscribe = onSnapshot(q, (snapshot) => {
        const notifications = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt,
        })) as NotificationData[];

        setNotifications(notifications);
        setUnreadCount(notifications.filter(n => !n.isRead).length);
        setIsLoading(false);
      }, (error) => {
        console.error('Error listening to personal notifications:', error);
        setIsLoading(false);
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUserId, userRole, scope]);

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
    if (!currentUserId) return false;

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

  const onAccountNotificationsChange = (
    userId: string,
    userRole: UserRole,
    callback: (notifications: NotificationData[]) => void
  ): (() => void) => {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('recipientId', '==', userId),
      where('recipientRole', '==', userRole),
      where('scope', '==', 'personal'),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt,
      })) as NotificationData[];

      callback(notifications);
    }, (error) => {
      console.error('Error listening to notifications:', error);
    });
  };

  const onAdminNotificationsChange = (
    callback: (notifications: NotificationData[]) => void
  ): (() => void) => {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('scope', '==', 'admin'),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt,
      })) as NotificationData[];

      callback(notifications);
    }, (error) => {
      console.error('Error listening to all notifications:', error);
    });
  };

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isLoading,
    onAccountNotificationsChange,
    onAdminNotificationsChange,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
