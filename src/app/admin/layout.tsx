'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import type { SessionUser } from '@/lib/auth'; // Import our custom SessionUser type

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const { data: session, status } = useSession(); // status can be 'loading', 'authenticated', or 'unauthenticated'

  const isAdmin = status === 'authenticated'; // Allow any authenticated user

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-600">Loading admin section...</p>
        {/* Consider a more visually appealing loader/spinner */}
      </div>
    );
  }

  if (status === 'unauthenticated') { // Redirect only if unauthenticated
    // Redirect if unauthenticated or not an admin
    // It's good practice to redirect from a client component using router.replace in useEffect or similar,
    // but for immediate redirection based on session status, this can be effective.
    // However, Next.js middleware or server-side checks are more robust for route protection.
    if (typeof window !== 'undefined') { // Ensure router.replace is called client-side
        router.replace('/'); // Or to a login page e.g., '/api/auth/signin'
    }
    // Show an access denied message while redirecting or if redirect fails
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-red-600">Access Denied. Redirecting...</p>
      </div>
    );
  }

  // If authenticated and is an admin, render the children
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gray-800 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-xl font-semibold">Admin Panel</h1>
            <div>
              <button onClick={() => router.push('/')} className="text-sm hover:text-gray-300">
                Back to Site
              </button>
              {/* Optionally, add a sign out button */}
              {/* <button onClick={() => signOut()} className="ml-4 text-sm hover:text-gray-300">Sign Out</button> */}
            </div>
        </div>
      </header>
      <main className="p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
} 