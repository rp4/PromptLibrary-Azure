'use client';

import { signIn as nextAuthSignIn } from 'next-auth/react';

/**
 * Signs in a user using NextAuth's credentials provider
 * @param email User's email
 * @param password User's password
 * @returns An object with success status and optional error
 */
export async function signIn(email: string, password: string) {
  try {
    const result = await nextAuthSignIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      return { success: false, error: new Error(result.error) };
    }
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Sign in error:', error);
    return { success: false, error: error instanceof Error ? error : new Error('An error occurred during sign in') };
  }
}

/**
 * Signs up a new user by calling the API endpoint
 * @param email User's email
 * @param password User's password
 * @returns An object with success status and optional error
 */
export async function signUp(email: string, password: string) {
  try {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to sign up');
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Sign up error:', error);
    return { success: false, error: error instanceof Error ? error : new Error('An error occurred during sign up') };
  }
}

/**
 * Requests a password reset for a user
 * @param email User's email
 * @returns An object with success status and optional error
 */
export async function resetPassword(email: string) {
  try {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to request password reset');
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Password reset error:', error);
    return { success: false, error: error instanceof Error ? error : new Error('An error occurred during password reset request') };
  }
} 