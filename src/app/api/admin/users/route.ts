import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUserSession, SessionUser } from '@/lib/auth'; // Using new auth helpers

export async function GET(request: Request) {
  try {
    const callingUser: SessionUser | null = await getCurrentUserSession();

    if (!callingUser || callingUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch all users. Select only the fields needed for the admin user management page.
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        name: true,       // Assuming you might want to display the name
        createdAt: true,  // Renamed from created_at to match Prisma schema
        emailVerified: true, // Optional: if you want to show verification status
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // No explicit error check needed here for prisma.user.findMany unless it throws an unexpected error,
    // as it returns an empty array if no users are found, which is a valid state.

    return NextResponse.json(users);

  } catch (err: any) {
    console.error('An unexpected error occurred while fetching users:', err);
    // It's good practice to avoid sending detailed internal error messages to the client.
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 