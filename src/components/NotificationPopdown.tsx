"use client";

import { useEffect, useState } from "react";
import { FiBell, FiX } from "react-icons/fi";

interface NotificationPopdownProps {
  notification: {
    id: string;
    title: string;
    message: string;
    type: string;
  } | null;
  onClose: () => void;
  onView?: (notificationId: string) => void;
}

const NotificationPopdown = ({ notification, onClose, onView }: NotificationPopdownProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for animation to complete
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  if (!notification) return null;

  const handleClick = () => {
    if (onView && notification) {
      onView(notification.id);
      onClose();
    }
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 transition-all duration-300 ease-in-out ${
        isVisible
          ? "translate-y-0 opacity-100"
          : "-translate-y-full opacity-0"
      }`}
    >
      <div
        className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm w-full cursor-pointer hover:shadow-xl transition-shadow"
        onClick={handleClick}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-theme-color rounded-full flex items-center justify-center">
              <FiBell className="w-4 h-4 text-white" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-gray-900 truncate">
              {notification.title}
            </h4>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {notification.message}
            </p>
            <p className="text-xs text-gray-500 mt-2 uppercase tracking-wide">
              {notification.type.replace("_", " ")}
            </p>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-3 bg-gray-200 rounded-full h-1">
          <div
            className="bg-theme-color h-1 rounded-full transition-all duration-100 ease-linear"
            style={{
              animation: isVisible ? "shrink 4s linear forwards" : "none",
            }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
};

export default NotificationPopdown;