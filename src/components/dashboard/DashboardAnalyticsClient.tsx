'use client';

import React from 'react';
import { FiBarChart, FiClock } from 'react-icons/fi';

const DashboardAnalyticsClient: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <FiBarChart className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
            <p className="text-gray-600 text-lg">Real-time insights and metrics coming soon</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <FiClock className="w-4 h-4" />
                <span>Real-time data</span>
              </div>
              <div className="w-px h-4 bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <FiBarChart className="w-4 h-4" />
                <span>Interactive charts</span>
              </div>
              <div className="w-px h-4 bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <FiBarChart className="w-4 h-4" />
                <span>Business insights</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Sales Analytics</h3>
              <p className="text-sm text-blue-700">Track revenue, orders, and customer behavior</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">Product Performance</h3>
              <p className="text-sm text-green-700">Monitor bestsellers and inventory trends</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-purple-900 mb-2">Customer Insights</h3>
              <p className="text-sm text-purple-700">Understand your audience and engagement</p>
            </div>
          </div>

          <div className="text-gray-500 text-sm">
            This feature is currently under development. Please check back soon for updates!
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardAnalyticsClient;