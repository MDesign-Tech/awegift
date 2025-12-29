'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationData } from '../../../type';
import { FiBell, FiX, FiCheck, FiMail } from 'react-icons/fi';
import Link from 'next/link';
import { formatNotificationDate } from '@/lib/date';
import { useNotifications } from '@/components/NotificationProvider'; // updated import

interface NotificationPopupProps {
  showSequentially?: boolean;
  autoDismissTime?: number;
}

const NotificationPopup: React.FC<NotificationPopupProps> = ({
  showSequentially = true,
  autoDismissTime = 5000,
}) => {
  const { notifications, markAsRead } = useNotifications();
  const [visibleNotifications, setVisibleNotifications] = useState<NotificationData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Watch for unread notifications
  useEffect(() => {
    const unread = notifications.filter(n => !n.isRead);
    if (showSequentially) {
      if (unread.length > 0 && currentIndex >= unread.length) setCurrentIndex(0);
      if (unread.length > 0 && currentIndex < unread.length) {
        const timer = setTimeout(() => setCurrentIndex(prev => prev + 1), autoDismissTime);
        return () => clearTimeout(timer);
      }
    } else {
      setVisibleNotifications(unread);
    }
  }, [notifications, currentIndex, showSequentially, autoDismissTime]);

  // Auto-mark notifications as read
  useEffect(() => {
    if (showSequentially && currentIndex > 0) {
      const unreadNotifications = notifications.filter(n => !n.isRead);
      const notificationToMark = unreadNotifications[currentIndex - 1];
      if (notificationToMark?.id) markAsRead(notificationToMark.id);
    }
  }, [currentIndex, notifications, markAsRead, showSequentially]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ORDER_CREATED':
      case 'ORDER_CONFIRMED':
      case 'ORDER_READY':
      case 'ORDER_COMPLETED':
        return <FiBell className="w-5 h-5 text-blue-600" />;
      case 'QUOTATION_RECEIVED':
      case 'QUOTATION_SENT':
      case 'QUOTATION_ACCEPTED':
      case 'QUOTATION_REJECTED':
        return <FiMail className="w-5 h-5 text-green-600" />;
      case 'PAYMENT_CONFIRMED':
        return <FiCheck className="w-5 h-5 text-green-600" />;
      case 'WELCOME':
        return <FiBell className="w-5 h-5 text-purple-600" />;
      default:
        return <FiBell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'ORDER_CREATED':
      case 'ORDER_CONFIRMED':
      case 'ORDER_READY':
      case 'ORDER_COMPLETED':
        return 'border-l-blue-500 bg-blue-50 hover:bg-blue-100';
      case 'QUOTATION_RECEIVED':
      case 'QUOTATION_SENT':
      case 'QUOTATION_ACCEPTED':
      case 'QUOTATION_REJECTED':
        return 'border-l-green-500 bg-green-50 hover:bg-green-100';
      case 'PAYMENT_CONFIRMED':
        return 'border-l-green-500 bg-green-50 hover:bg-green-100';
      case 'WELCOME':
        return 'border-l-purple-500 bg-purple-50 hover:bg-purple-100';
      default:
        return 'border-l-gray-500 bg-gray-50 hover:bg-gray-100';
    }
  };

  const handleNotificationClick = (notification: NotificationData, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (notification.id) markAsRead(notification.id);
  };

  const unreadNotifications = notifications.filter(n => !n.isRead);
  const currentNotification = showSequentially ? unreadNotifications[currentIndex] || null : null;

  const renderNotificationContent = (notification: NotificationData) => (
    <div className="p-4">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">{getNotificationIcon(notification.type)}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{notification.title}</p>
          <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-gray-500">{formatNotificationDate(notification.createdAt)}</span>
            {notification.url && (
              <span className="text-xs text-blue-600 font-medium">Click to view →</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {showSequentially && currentNotification && (
        <motion.div
          key={currentNotification.id}
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={`fixed top-4 right-4 z-50 w-80 max-w-md shadow-lg rounded-lg overflow-hidden border cursor-pointer ${getNotificationColor(currentNotification.type)}`}
        >
          {currentNotification.url ? (
            <Link
              href={currentNotification.url}
              onClick={(e) => handleNotificationClick(currentNotification, e)}
              className="block"
            >
              {renderNotificationContent(currentNotification)}
            </Link>
          ) : (
            <div onClick={() => handleNotificationClick(currentNotification)} className="block">
              {renderNotificationContent(currentNotification)}
            </div>
          )}
        </motion.div>
      )}

      {!showSequentially && (
        <AnimatePresence>
          {visibleNotifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className={`fixed top-4 right-4 z-50 w-80 max-w-md shadow-lg rounded-lg overflow-hidden border cursor-pointer ${getNotificationColor(notification.type)} mb-2 last:mb-0`}
            >
              {notification.url ? (
                <Link
                  href={notification.url}
                  onClick={(e) => handleNotificationClick(notification, e)}
                  className="block"
                >
                  {renderNotificationContent(notification)}
                </Link>
              ) : (
                <div onClick={() => handleNotificationClick(notification)} className="block">
                  {renderNotificationContent(notification)}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </>
  );
};

export default NotificationPopup;
