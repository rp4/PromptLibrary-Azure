'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react'; // Import NextAuth hooks
import AuthForm from '@/components/AuthForm'; // This will need to be NextAuth compatible
import { ClockIcon, UserCircleIcon, CogIcon } from '@heroicons/react/24/outline';
import type { SessionUser } from '@/lib/auth'; // For session user type
import UserStats from '@/components/UserStats'; // Import the UserStats component

// These interfaces will remain, but data will be fetched via new API routes
interface Group {
  id: string;
  name: string;
  order_id: number;
}

interface Subgroup {
  id: string;
  name: string;
  group_id: string;
  order_id: number;
}

// Helper function to clear any existing auth cookies that may be invalid
const clearInvalidAuthCookies = () => {
  if (typeof window !== 'undefined') {
    // List of auth-related cookie names that might need to be cleared
    const cookiesToClear = ['next-auth.session-token', 'next-auth.csrf-token', 'next-auth.callback-url'];
    
    cookiesToClear.forEach(cookieName => {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });
    
    console.log('Cleared any potentially invalid auth cookies');
  }
};

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession(); // status: loading, authenticated, unauthenticated
  const user = session?.user as SessionUser | undefined;

  console.log('User session status:', status);
  console.log('Full session object:', session);
  console.log('User object (from session.user):', user);

  const [groups, setGroups] = useState<Group[]>([]);
  const [subgroups, setSubgroups] = useState<Subgroup[]>([]);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  // const [loading, setLoading] = useState(true); // loading state handled by session status

  // Clear any potentially invalid cookies on initial page load
  useEffect(() => {
    if (status === 'loading') {
      clearInvalidAuthCookies();
    }
  }, []);

  const fetchData = useCallback(async () => {
    // TODO: Replace with fetch from /api/groups and /api/subgroups
    console.log('Fetching group and subgroup data...');
    try {
      const groupsResponse = await fetch('/api/groups');
      if (groupsResponse.ok) {
        const groupsData = await groupsResponse.json();
        setGroups(groupsData);
        if (groupsData.length > 0) {
            setActiveGroup(groupsData[0]?.id);
        }
      } else {
        console.error('Failed to fetch groups');
        setGroups([]); // Set to empty or handle error appropriately
      }

      const subgroupsResponse = await fetch('/api/subgroups');
      if (subgroupsResponse.ok) {
        setSubgroups(await subgroupsResponse.json());
      } else {
        console.error('Failed to fetch subgroups');
        setSubgroups([]); // Set to empty or handle error appropriately
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setGroups([]);
      setSubgroups([]);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData();
    }
  }, [status, fetchData]);

  const handleSubgroupClick = (subgroupId: string) => {
    router.push(`/prompts?subgroup=${subgroupId}`);
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' }); // Redirect to homepage after sign out
    // clearInvalidAuthCookies(); // Clear cookies on sign out too
    // router.push('/'); // Optionally force redirect if needed after sign out
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        {/* AuthForm needs to be compatible with NextAuth (e.g., use signIn) */}
        <AuthForm onSuccess={() => { /* session status will change, triggering re-render */ }} />
      </div>
    );
  }

  // Authenticated state (status === 'authenticated')
  const filteredSubgroups = subgroups.filter(
    (subgroup) => subgroup.group_id === activeGroup
  );

  return (
    <main className="min-h-screen">
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-2xl font-bold hover:opacity-90 transition-opacity">
              PromptLibrary
            </Link>
            
            {/* Add UserStats component in the middle */}
            <UserStats className="hidden md:flex mt-1" />
            
            <nav className="flex items-center space-x-4">
              <Link href="/prompts/history" className="hover:text-blue-200 transition-colors flex items-center" title="Prompt History">
                <ClockIcon className="h-6 w-6" />
                <span className="ml-2 hidden sm:inline">History</span>
              </Link>
              {user && (
                <Link href="/admin" className="hover:text-blue-200 transition-colors flex items-center" title="Admin Panel">
                  <CogIcon className="h-6 w-6" />
                  <span className="ml-2 hidden sm:inline">Admin</span>
                </Link>
              )}
              <button onClick={handleSignOut} className="hover:text-blue-200 transition-colors flex items-center" title="Sign Out">
                <UserCircleIcon className="h-6 w-6" />
                <span className="ml-2 hidden sm:inline">Sign Out ({user?.email || user?.name})</span>
              </button>
            </nav>
          </div>
          
          {/* Add UserStats component for mobile view */}
          <div className="pb-2 md:hidden">
            <UserStats />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-xl shadow-sm">
          {groups.map((group) => (
            <button
              key={group.id}
              onClick={() => setActiveGroup(group.id)}
              className={`flex-1 py-3 px-4 sm:px-6 rounded-lg font-semibold text-sm sm:text-base transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 ${activeGroup === group.id ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-700 hover:bg-blue-100 hover:text-blue-700'}`}
            >
              {group.name}
            </button>
          ))}
        </div>

        {filteredSubgroups.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSubgroups.map((subgroup) => (
                <button
                key={subgroup.id}
                onClick={() => handleSubgroupClick(subgroup.id)}
                className="bg-white rounded-xl shadow-lg p-6 text-left hover:shadow-xl hover:scale-105 transform transition-all duration-300 ease-in-out border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                <h3 className="text-lg font-semibold text-blue-700">{subgroup.name}</h3>
                {/* Add more subgroup details here if needed */}
                </button>
            ))}
            </div>
        ) : (
            activeGroup && <p className="text-center text-gray-500">No subgroups found for the selected group.</p>
        )}
         {groups.length === 0 && status === 'authenticated' && (
            <p className="text-center text-gray-500">No groups found. An administrator may need to configure them.</p>
        )}
      </div>
    </main>
  );
} 