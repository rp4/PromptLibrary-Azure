'use client';

import React from 'react';
import Link from 'next/link';
import { UserGroupIcon, CogIcon } from '@heroicons/react/24/outline';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome to the admin control center. Manage users and system configurations.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/admin/users" legacyBehavior>
          <a className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 ease-in-out">
            <div className="flex items-center space-x-4">
              <UserGroupIcon className="h-10 w-10 text-blue-500" />
              <div>
                <h2 className="text-xl font-semibold text-gray-700">Manage Users</h2>
                <p className="text-gray-500 text-sm mt-1">View, edit roles, and manage user accounts.</p>
              </div>
            </div>
          </a>
        </Link>

        <Link href="/admin/llm-configs" legacyBehavior>
          <a className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 ease-in-out">
            <div className="flex items-center space-x-4">
              <CogIcon className="h-10 w-10 text-green-500" />
              <div>
                <h2 className="text-xl font-semibold text-gray-700">LLM Configurations</h2>
                <p className="text-gray-500 text-sm mt-1">Configure and manage Language Model APIs.</p>
              </div>
            </div>
          </a>
        </Link>
      </div>

      {/* You can add more sections or stats here later */}
      {/* 
      <div className="mt-12 p-6 bg-white rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">System Overview</h3>
        <p className="text-gray-600">Some quick stats or information can go here...</p>
      </div>
      */}
    </div>
  );
} 