'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAdminNotifications } from '@/hooks/useAdminNotifications';
import { FiBell, FiMail, FiRefreshCw } from 'react-icons/fi';
import { formatNotificationDate } from '@/lib/date';

const DashboardNotificationsClient: React.FC = () => {
  const { notifications, isLoading, refetch } = useAdminNotifications();
  const router = useRouter();

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/admin/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        refetch();
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleNotificationClick = async (notification: any) => {
    if (notification.id && !notification.isRead) {
      await markAsRead(notification.id);
    }
    if (notification.url) {
      router.push(notification.url);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ORDER_PLACED':
        return <FiBell className="w-5 h-5 text-blue-600" />;
      case 'QUOTATION_REQUEST':
        return <FiMail className="w-5 h-5 text-green-600" />;
      default:
        return <FiBell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'ORDER_PLACED':
        return 'border-l-blue-500 bg-blue-50 hover:bg-blue-100';
      case 'QUOTATION_REQUEST':
        return 'border-l-green-500 bg-green-50 hover:bg-green-100';
      default:
        return 'border-l-gray-500 bg-gray-50 hover:bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center mb-4 sm:mb-0">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              System Notifications ({notifications.length})
            </h2>
          </div>
          <div className="flex items-center flex-wrap space-x-2">
            <button
              onClick={refetch}
              className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              title="Refresh notifications"
            >
              <FiRefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="p-6">
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="space-y-3">
                <div className="text-4xl">🔔</div>
                <h3 className="text-lg font-medium text-gray-900">
                  No System Notifications Yet
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  System notifications will appear here when users place orders or request quotations.
                </p>
              </div>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer ${getNotificationColor(notification.type)}`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {notification.title}
                      </p>
                      {!notification.isRead && (
                        <span className="inline-block w-2 h-2 bg-theme-color rounded-full ml-2"></span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      {notification.message}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {formatNotificationDate(notification.createdAt)}
                      </span>
                      {notification.url && (
                        <span className="text-xs text-blue-600 font-medium">
                          Click to view →
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardNotificationsClient;