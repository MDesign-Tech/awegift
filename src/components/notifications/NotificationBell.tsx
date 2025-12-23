'use client';

import React from 'react';
import { useNotifications } from '@/lib/notification/provider';
import { FiBell, FiBellOff } from 'react-icons/fi';
import Link from 'next/link';

interface NotificationBellProps {
  className?: string;
  showBadge?: boolean;
  position?: 'header' | 'sidebar';
}

const NotificationBell: React.FC<NotificationBellProps> = ({
  className = '',
  showBadge = true,
  position = 'header',
}) => {
  const { unreadCount, isLoading } = useNotifications();

  const bellClasses = `
    relative inline-flex items-center justify-center p-2 rounded-full
    transition-colors duration-200
    ${position === 'header' 
      ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100' 
      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
    }
    ${className}
  `;

  const badgeClasses = `
    absolute top-0 right-0 inline-flex items-center justify-center
    px-2 py-1 text-xs font-bold leading-none text-white transform
    translate-x-1 -translate-y-1 bg-red-600 rounded-full
    ${unreadCount === 0 ? 'hidden' : ''}
  `;

  return (
    <Link href="/account/notifications" className={bellClasses}>
      <FiBell className="h-6 w-6" />
      
      {showBadge && (
        <span className={badgeClasses}>
          {isLoading ? '...' : unreadCount}
        </span>
      )}
    </Link>
  );
};

export default NotificationBell;