'use client';

import React, { useState, useEffect, useCallback } from 'react';

// Define a type for the user data fetched from the API
interface AdminUser {
  id: string;
  email: string;
  role: string;
  name?: string | null;      // Added name, as it's in the API response
  createdAt: string;    // Changed from created_at to createdAt
  emailVerified?: Date | string | null; // Added emailVerified
}

const ROLES = ['user', 'admin']; // Define available roles

export default function ManageUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch users: ${response.statusText}`);
      }
      const data = await response.json();
      setUsers(data as AdminUser[]); // Use the new AdminUser type
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setError(null);
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update role: ${response.statusText}`);
      }
      await fetchUsers(); 
      setEditingUserId(null);
    } catch (err: any) {
      console.error('Error updating role:', err);
      setError(err.message || 'An unexpected error occurred while updating role.');
    }
  };

  const startEditRole = (user: AdminUser) => {
    setEditingUserId(user.id);
    setSelectedRole(user.role || 'user'); // Default to 'user' if role is somehow null/undefined
  };

  if (isLoading) {
    return <div className="text-center p-8"><p className="text-gray-600">Loading users...</p></div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Manage User Roles</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 animate-fadeIn" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              {/* Optional: Add column for Name if desired */}
              {/* <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th> */}
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Role
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined On
              </th>
              {/* Optional: Add column for Email Verified status */}
              {/* <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verified</th> */}
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.length === 0 && !isLoading && (
              <tr>
                <td colSpan={4} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                  No users found.
                </td>
              </tr>
            )}
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {user.email}
                </td>
                {/* Optional: Display user.name here if column added */}
                {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.name || 'N/A'}</td> */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {editingUserId === user.id ? (
                    <select 
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="input text-sm p-1"
                    >
                      {ROLES.map(role => (
                        <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                      ))}
                    </select>
                  ) : (
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                      {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'N/A'}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString()} {/* Changed to user.createdAt */}
                </td>
                {/* Optional: Display emailVerified status */}
                {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.emailVerified ? 'Yes' : 'No'}</td> */}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {editingUserId === user.id ? (
                    <>
                      <button 
                        onClick={() => handleRoleChange(user.id, selectedRole)} 
                        className="btn-primary text-xs py-1 px-2 mr-2"
                      >
                        Save
                      </button>
                      <button 
                        onClick={() => setEditingUserId(null)} 
                        className="btn-secondary text-xs py-1 px-2"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => startEditRole(user)} 
                      className="btn-secondary text-xs py-1 px-2"
                    >
                      Edit Role
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 