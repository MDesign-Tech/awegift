import React from 'react';

interface AccessDeniedProps {
  title?: string;
  message?: string;
  helpText?: string;
}

const AccessDenied: React.FC<AccessDeniedProps> = ({
  message = "You don't have access to view data from this page."
}) => {
  return (
    <div className="flex items-center justify-center min-h-96">
      <div className="text-center">
        <div className="text-6xl mb-4">🛡️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          {message}
        </p>
      </div>
    </div>
  );
};

export default AccessDenied;