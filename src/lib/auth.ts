import { getServerSession } from 'next-auth/next';
import type { User as NextAuthDefaultUser } from 'next-auth'; // Use core NextAuth User type for extension
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from './prisma';
import bcrypt from 'bcrypt';
import { User as PrismaClientUser } from '@/generated/prisma'; // Adjusted path to Prisma client output

// Define a more specific type for the user object in the session
export interface SessionUser extends NextAuthDefaultUser {
  id: string;
  role: string;
  // Add other properties you expect in session.user, e.g., name, email
  name?: string | null;
  email?: string | null;
}

/**
 * Retrieves the current user's session data.
 * This function is intended for server-side usage (React Server Components, API routes).
 * @returns {Promise<SessionUser | null>} The session user object or null if not authenticated.
 */
export async function getCurrentUserSession(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (session && session.user) {
    return session.user as SessionUser; // Cast to your more specific SessionUser type
  }
  return null;
}

/**
 * Creates a new user in the database.
 * @param email User's email.
 * @param password User's plain text password.
 * @param role User's role (defaults to 'user').
 * @param name Optional user's name.
 * @returns An object with the created user (excluding password) or an error message.
 */
export async function signUpUser(email: string, password: string, role: string = 'user', name?: string) {
  try {
    if (!email || !password) {
      return { user: null, error: 'Email and password are required.' };
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { user: null, error: 'An account with this email already exists.' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = await prisma.user.create({
      data: {
        email,
        hashedPassword,
        role,
        name: name || null,
      },
    });

    // Exclude hashedPassword from the returned object for security
    const { hashedPassword: _, ...userWithoutPassword } = newUser;
    return { user: userWithoutPassword, error: null };

  } catch (error: any) {
    console.error("Error during sign up:", error);
    // Check for Prisma-specific error codes if necessary, e.g., P2002 for unique constraint
    return { user: null, error: 'Failed to create user. Please try again later.' };
  }
}

/**
 * Fetches the full Prisma User object for the currently authenticated user.
 * Useful if you need more fields than what's available in the basic session.
 * @returns {Promise<PrismaClientUser | null>} The full Prisma user object or null.
 */
export async function getCurrentPrismaUser(): Promise<PrismaClientUser | null> {
    const session = await getCurrentUserSession();
    if (!session?.id) {
        return null;
    }
    try {
        const user = await prisma.user.findUnique({
            where: { id: session.id },
        });
        return user;
    } catch (error) {
        console.error("Error fetching full Prisma user:", error);
        return null;
    }
}

// Note: Standard signIn and signOut operations are typically handled by NextAuth.js client-side functions
// (e.g., `signIn()` and `signOut()` from 'next-auth/react') or by navigating to NextAuth.js default pages.
// You generally don't need to re-implement them here unless for very specific custom server-side logic. 