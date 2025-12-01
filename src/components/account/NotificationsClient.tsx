"use client";

import { useState, useEffect } from "react";
import { FiBell, FiCheckCircle, FiClock, FiLoader } from "react-icons/fi";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: Date;
}

export default function NotificationsClient() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingRead, setMarkingRead] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/user/notifications");
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched notifications:", data.notifications);
        setNotifications(data.notifications || []);
      } else {
        console.error("Failed to fetch notifications:", response.status, response.statusText);
        const errorData = await response.json().catch(() => ({}));
        console.error("Error data:", errorData);
        setError(`Failed to load notifications: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setError("Network error while loading notifications");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    setMarkingRead(notificationId);
    try {
      const response = await fetch("/api/user/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notificationId, read: true }),
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notif =>
            notif.id === notificationId ? { ...notif, read: true } : notif
          )
        );
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    } finally {
      setMarkingRead(null);
    }
  };

  const formatDate = (date: any) => {
    try {
      let dateObj: Date;

      if (date instanceof Date) {
        dateObj = date;
      } else if (typeof date === 'string') {
        dateObj = new Date(date);
      } else if (date && typeof date === 'object' && date.toDate) {
        // Firestore Timestamp
        dateObj = date.toDate();
      } else {
        return 'Unknown date';
      }

      const now = new Date();
      const diffTime = now.getTime() - dateObj.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return 'Today';
      } else if (diffDays === 1) {
        return 'Yesterday';
      } else if (diffDays < 7) {
        return `${diffDays} days ago`;
      } else {
        return dateObj.toLocaleDateString();
      }
    } catch (error) {
      console.error('Error formatting date:', error, date);
      return 'Unknown date';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          My Notifications
        </h1>
        <p className="text-gray-600">
          Stay updated with your latest activities and messages
          {unreadCount > 0 && (
            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-theme-color text-white">
              {unreadCount} unread
            </span>
          )}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <FiLoader className="animate-spin h-8 w-8 text-theme-color mx-auto" />
            <p className="mt-2 text-gray-600">Loading notifications...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="text-red-500 mb-4">
              <FiBell className="w-16 h-16 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Notifications</h3>
              <p className="text-gray-500 mb-4">{error}</p>
              <button
                onClick={fetchNotifications}
                className="px-4 py-2 bg-theme-color text-white rounded hover:bg-theme-color/90"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <FiBell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications yet</h3>
            <p className="text-gray-500 mb-4">You'll see your notifications here when you have any updates.</p>
            <button
              onClick={fetchNotifications}
              className="px-4 py-2 bg-theme-color text-white rounded hover:bg-theme-color/90"
            >
              Refresh
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <span className="text-sm text-gray-600">
                {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
              </span>
              <button
                onClick={fetchNotifications}
                disabled={loading}
                className="px-3 py-1 text-sm bg-theme-color text-white rounded hover:bg-theme-color/90 disabled:opacity-50"
              >
                Refresh
              </button>
            </div>
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-6 hover:bg-gray-50 transition-colors ${
                  !notification.read ? "bg-blue-50 border-l-4 border-blue-500" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {!notification.read ? (
                        <FiClock className="w-4 h-4 text-blue-500" />
                      ) : (
                        <FiCheckCircle className="w-4 h-4 text-green-500" />
                      )}
                      <h4 className="font-medium text-gray-900">{notification.title}</h4>
                      <span className="text-xs text-gray-500">
                        {formatDate(new Date(notification.createdAt))}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{notification.message}</p>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {notification.type.replace("_", " ").toUpperCase()}
                    </span>
                  </div>
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      disabled={markingRead === notification.id}
                      className="ml-4 px-3 py-1 text-sm bg-theme-color text-white rounded hover:bg-theme-color/90 disabled:opacity-50"
                    >
                      {markingRead === notification.id ? "Marking..." : "Mark as Read"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
