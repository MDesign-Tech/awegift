'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiBell, FiX, FiCheck, FiMail } from 'react-icons/fi';
import { formatNotificationDate } from '@/lib/date';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationData } from '../../../type';

const NotificationsClient: React.FC = () => {
  const { notifications, isLoading: loading, markAsRead } = useNotifications();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleNotificationClick = async (notification: NotificationData) => {
    if (notification.id && !notification.isRead) {
      await markAsRead(notification.id);
    }

    if (notification.url) {
      router.push(notification.url);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ORDER_CREATED':
      case 'ORDER_PAID':
      case 'ORDER_READY':
      case 'ORDER_COMPLETED':
      case 'ORDER_CANCELLED':
      case 'ORDER_FAILED':
      case 'ORDER_REFUNDED':
        return <FiBell className="w-5 h-5 text-blue-600" />;
      case 'QUOTATION_RECEIVED':
      case 'QUOTATION_SENT':
      case 'QUOTATION_ACCEPTED':
      case 'QUOTATION_REJECTED':
        return <FiMail className="w-5 h-5 text-green-600" />;
      case 'WELCOME':
      case 'EMAIL_VERIFICATION':
      case 'PASSWORD_RESET':
      case 'ACCOUNT_UPDATED':
      case 'SECURITY_ALERT':
        return <FiBell className="w-5 h-5 text-purple-600" />;
      case 'NEW_PRODUCT_LAUNCH':
        return <FiBell className="w-5 h-5 text-orange-600" />;
      case 'ADMIN_NEW_ORDER':
      case 'ADMIN_PAYMENT_FAILED':
      case 'ADMIN_LOW_STOCK':
      case 'ADMIN_NEW_QUOTATION':
      case 'ADMIN_ORDER_CANCELLED':
      case 'ADMIN_NEW_USER':
        return <FiBell className="w-5 h-5 text-red-600" />;
      default:
        return <FiBell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'ORDER_CREATED':
      case 'ORDER_PAID':
      case 'ORDER_READY':
      case 'ORDER_COMPLETED':
      case 'ORDER_CANCELLED':
      case 'ORDER_FAILED':
      case 'ORDER_REFUNDED':
        return 'border-l-blue-500 bg-blue-50 hover:bg-blue-100';
      case 'QUOTATION_RECEIVED':
      case 'QUOTATION_SENT':
      case 'QUOTATION_ACCEPTED':
      case 'QUOTATION_REJECTED':
        return 'border-l-green-500 bg-green-50 hover:bg-green-100';
      case 'WELCOME':
      case 'EMAIL_VERIFICATION':
      case 'PASSWORD_RESET':
      case 'ACCOUNT_UPDATED':
      case 'SECURITY_ALERT':
        return 'border-l-purple-500 bg-purple-50 hover:bg-purple-100';
      case 'NEW_PRODUCT_LAUNCH':
        return 'border-l-orange-500 bg-orange-50 hover:bg-orange-100';
      case 'ADMIN_NEW_ORDER':
      case 'ADMIN_PAYMENT_FAILED':
      case 'ADMIN_LOW_STOCK':
      case 'ADMIN_NEW_QUOTATION':
      case 'ADMIN_ORDER_CANCELLED':
      case 'ADMIN_NEW_USER':
        return 'border-l-red-500 bg-red-50 hover:bg-red-100';
      default:
        return 'border-l-gray-500 bg-gray-50 hover:bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Notifications</h2>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
              <div className="flex items-start space-x-3">
                <div className="w-5 h-5 bg-gray-300 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Notifications</h2>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="text-center py-12 bg-light-bg rounded-lg">
            <div className="space-y-3">
              <div className="text-4xl">🔔</div>
              <h3 className="text-lg font-medium text-gray-900">
                No Notifications Yet
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                You don't have any notifications at the moment. We'll notify you when there are updates on your orders, quotes, or account.
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
  );
};

export default NotificationsClient;