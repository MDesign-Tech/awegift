"use client";

import { useNetwork } from '@/contexts/NetworkContext';

const NetworkStatus = () => {
  const { isOnline, justConnected } = useNetwork();

  if (isOnline && !justConnected) return null;

  return (
    <div
      className={`sticky top-0 w-full py-1 text-center text-white font-medium text-xs z-50 ${
        !isOnline ? 'bg-black' : 'bg-green-500'
      }`}
    >
      {!isOnline ? 'No connection' : 'Connected to the internet'}
    </div>
  );
};

export default NetworkStatus;