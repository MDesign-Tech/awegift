'use client';

import { useState, useEffect } from 'react';
import { NotificationData } from '../../type';

export const useAdminNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`/api/admin/notifications?t=${Date.now()}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
      } else {
        console.error('Failed to fetch admin notifications');
      }
    } catch (error) {
      console.error('Error fetching admin notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/admin/notifications/${notificationId}`, {
        method: 'PATCH',
      });
      if (response.ok) {
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
      } else {
        console.error('Failed to mark as read');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/admin/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      } else {
        console.error('Failed to delete notification');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const bulkDelete = async (ids: string[]) => {
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids }),
      });
      if (response.ok) {
        setNotifications(prev => prev.filter(n => !ids.includes(n.id || '')));
      } else {
        console.error('Failed to bulk delete');
      }
    } catch (error) {
      console.error('Error bulk deleting notifications:', error);
    }
  };

  const refetch = () => {
    fetchNotifications();
  };

  return {
    notifications,
    isLoading,
    markAsRead,
    deleteNotification,
    bulkDelete,
    refetch,
  };
};