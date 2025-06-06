import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUserSession, SessionUser } from '@/lib/auth';

export async function PUT(request: Request, { params }: { params: { userId: string } }) {
  try {
    const callingUser: SessionUser | null = await getCurrentUserSession();

    if (!callingUser || callingUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { userId } = params;
    const { role } = await request.json();

    if (!userId || typeof role !== 'string') {
      return NextResponse.json({ error: 'User ID and role (string) are required' }, { status: 400 });
    }

    // Optional: Validate if the role is one of the expected values (e.g., 'admin', 'user')
    const validRoles = ['admin', 'user']; // Extend this if you have more roles
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` }, { status: 400 });
    }

    // Prevent admin from accidentally removing their own admin status via this specific endpoint
    if (callingUser.id === userId && role !== 'admin') {
        return NextResponse.json({ error: 'Admin cannot remove their own admin status through this endpoint.' }, { status: 400 });
    }

    // Check if the target user exists before attempting to update
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update the user's role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { // Select the fields you want to return
        id: true,
        email: true,
        role: true,
        name: true,
      },
    });

    return NextResponse.json(updatedUser);

  } catch (err: any) {
    console.error(`An unexpected error occurred while updating role for user ${params.userId}:`, err);
    if (err.name === 'SyntaxError') { // Handle malformed JSON from request.json()
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
    // Handle Prisma-specific errors if needed, e.g., record not found during update (though we check above)
    // if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
    //   return NextResponse.json({ error: 'User not found for update' }, { status: 404 });
    // }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 