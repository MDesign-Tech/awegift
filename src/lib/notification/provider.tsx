'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { auth as firebaseAuth, db } from '@/lib/firebase/config';
import { NotificationData } from '../../../type';
import { UserRole } from "@/lib/rbac/roles";
import { useRouter } from 'next/navigation';

interface NotificationContextType {
  notifications: NotificationData[];
  unreadCount: number;
  markAsRead: (notificationId: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  deleteNotification: (notificationId: string) => Promise<boolean>;
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
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id: string; role: UserRole } | null>(null);
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);
  
  const [lastPopupShown, setLastPopupShown] = useState<Date | null>(null);
  
  
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(firebaseAuth, async (user) => {
      if (user) {
        // Get user role from Firestore or context
        try {
          const userDoc = await user.getIdTokenResult();
          const role = userDoc.claims.role as UserRole || 'user';
          
          setCurrentUser({ id: user.uid, role });
          const key = `lastPopupShown_${user.uid}`;
          const stored = localStorage.getItem(key);
          setLastPopupShown(stored ? new Date(stored) : null);
        } catch (error) {
          console.error('Error getting user role:', error);
          setCurrentUser({ id: user.uid, role: 'user' });
        }
      } else {
        setCurrentUser(null);
        setNotifications([]);
        setUnreadCount(0);
        setIsLoading(false);
        
        // Unsubscribe from previous listener
        if (unsubscribe) {
          unsubscribe();
          setUnsubscribe(null);
        }
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Set up real-time listener
    let unsubscribeListener: (() => void) | null = null;

    if (currentUser.role === 'admin') {
      // Admin sees all notifications
      const notificationsRef = collection(db, 'notifications');
      const q = query(notificationsRef, orderBy('createdAt', 'desc'));

      unsubscribeListener = onSnapshot(q, (snapshot) => {
        const allNotifications: NotificationData[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt),
        })) as NotificationData[];

        setNotifications(allNotifications);
        const unread = allNotifications.filter(n => !n.isRead).length;
        setUnreadCount(unread);
        setIsLoading(false);
      }, (error) => {
        console.error('Error listening to all notifications:', error);
        setIsLoading(false);
      });
    } else {
      // User sees only their notifications
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('recipientId', '==', currentUser.id),
        where('recipientRole', '==', currentUser.role),
        orderBy('createdAt', 'desc')
      );

      unsubscribeListener = onSnapshot(q, (snapshot) => {
        const userNotifications: NotificationData[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt),
        })) as NotificationData[];

        setNotifications(userNotifications);
        const unread = userNotifications.filter(n => !n.isRead).length;
        setUnreadCount(unread);
        setIsLoading(false);
      }, (error) => {
        console.error('Error listening to user notifications:', error);
        setIsLoading(false);
      });
    }

    // Store unsubscribe function
    setUnsubscribe(() => unsubscribeListener);

    return () => {
      if (unsubscribeListener) {
        unsubscribeListener();
      }
    };
  }, [currentUser]);

  const markAsRead = async (notificationId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/user/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, isRead: true } : n
          )
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
    if (!currentUser) return false;

    try {
      const response = await fetch('/api/user/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'markAllAsRead' }),
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, isRead: true }))
        );
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
      const response = await fetch(`/api/admin/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const wasUnread = !notifications.find(n => n.id === notificationId)?.isRead;
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        if (wasUnread) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  };

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isLoading,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};