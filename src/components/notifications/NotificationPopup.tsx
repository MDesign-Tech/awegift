'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationData } from '../../../type';
import { FiBell, FiX, FiCheck, FiMail } from 'react-icons/fi';
import Link from 'next/link';
import { formatNotificationDate } from '@/lib/date';

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

  useEffect(() => {
    // Filter unread notifications and show them sequentially
    const unreadNotifications = notifications.filter(n => !n.isRead);

    if (showSequentially) {
      // Reset currentIndex if there are new unread notifications
      if (unreadNotifications.length > 0 && currentIndex >= unreadNotifications.length) {
        setCurrentIndex(0);
      }

      if (unreadNotifications.length > 0 && currentIndex < unreadNotifications.length) {
        // Show notifications one by one
        const timer = setTimeout(() => {
          setCurrentIndex(prev => prev + 1);
        }, autoDismissTime);

        return () => clearTimeout(timer);
      }
    } else {
      // Show all unread notifications at once
      setVisibleNotifications(unreadNotifications);
    }
  }, [notifications, currentIndex, showSequentially, autoDismissTime]);

  useEffect(() => {
    // Auto-mark as read when notification becomes visible
    if (showSequentially && currentIndex > 0) {
      const unreadNotifications = notifications.filter(n => !n.isRead);
      const notificationToMark = unreadNotifications[currentIndex - 1];
      if (notificationToMark?.id) {
        markAsRead(notificationToMark.id);
      }
    }
  }, [currentIndex, notifications, markAsRead, showSequentially]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ORDER_PLACED':
      case 'ORDER_STATUS_CHANGED':
      case 'ORDER_READY':
      case 'ORDER_COMPLETED':
        return <FiBell className="w-5 h-5 text-blue-600" />;
      case 'QUOTATION_REQUEST':
      case 'QUOTATION_RESPONSE':
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
      case 'ORDER_PLACED':
      case 'ORDER_STATUS_CHANGED':
      case 'ORDER_READY':
      case 'ORDER_COMPLETED':
        return 'border-l-blue-500 bg-blue-50 hover:bg-blue-100';
      case 'QUOTATION_REQUEST':
      case 'QUOTATION_RESPONSE':
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
    
    if (notification.id) {
      markAsRead(notification.id);
    }
    
    // Navigation will be handled by the Link component
  };

  const unreadNotifications = notifications.filter(n => !n.isRead);
  const currentNotification = showSequentially ? unreadNotifications[currentIndex] || null : null;

  // Function to render notification content
  const renderNotificationContent = (notification: NotificationData) => (
    <div className="p-4">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getNotificationIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {notification.title}
          </p>
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
            <div 
              onClick={() => handleNotificationClick(currentNotification)}
              className="block"
            >
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
                <div 
                  onClick={() => handleNotificationClick(notification)}
                  className="block"
                >
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