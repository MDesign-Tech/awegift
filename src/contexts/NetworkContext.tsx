"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface Toast {
  id: string;
  message: string;
  type: 'error' | 'success' | 'info';
}

interface NetworkContextType {
  isOnline: boolean;
  justConnected: boolean;
  showToast: (message: string, type?: 'error' | 'success' | 'info') => void;
  toasts: Toast[];
  removeToast: (id: string) => void;
  retryFetch: <T>(fetchFn: () => Promise<T>, retries?: number, delay?: number) => Promise<T>;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};

export const NetworkProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [justConnected, setJustConnected] = useState<boolean>(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setJustConnected(true);
      setTimeout(() => setJustConnected(false), 3000);
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('Network connection error', 'error');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const showToast = (message: string, type: 'error' | 'success' | 'info' = 'info') => {
    const id = Date.now().toString();
    const toast: Toast = { id, message, type };
    setToasts((prev) => [...prev, toast]);

    // Auto-remove after 5 seconds for error, 3 for others
    const duration = type === 'error' ? 5000 : 3000;
    setTimeout(() => removeToast(id), duration);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const retryFetch = async <T,>(fetchFn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
    for (let i = 0; i < retries; i++) {
      try {
        return await fetchFn();
      } catch (error) {
        if (i === retries - 1) throw error;
        if (error instanceof TypeError || (error as Error).message.includes('Failed to fetch')) {
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      }
    }
    throw new Error('Retry failed');
  };

  return (
    <NetworkContext.Provider value={{ isOnline, justConnected, showToast, toasts, removeToast, retryFetch }}>
      {children}
    </NetworkContext.Provider>
  );
};