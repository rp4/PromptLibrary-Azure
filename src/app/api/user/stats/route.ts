import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { SessionUser } from '@/lib/auth';

export async function GET() {
  try {
    // Get the authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Cast to SessionUser type to access id property
    const user = session.user as SessionUser;
    
    if (!user.id) {
      return NextResponse.json({ error: 'User ID not found in session' }, { status: 401 });
    }
    
    // Get the count of prompts run by the user
    const promptsRunCount = await prisma.promptUsageLog.count({
      where: {
        userId: user.id
      }
    });
    
    // Get the count of prompts created by the user
    const promptsCreatedCount = await prisma.legacyPrompt.count({
      where: {
        createdById: user.id
      }
    });
    
    // Get the count of likes/favorites received on user's prompts
    const likesReceivedCount = await prisma.like.count({
      where: {
        legacyPrompt: {
          createdById: user.id
        }
      }
    });
    
    return NextResponse.json({
      promptsRun: promptsRunCount,
      promptsCreated: promptsCreatedCount,
      likesReceived: likesReceivedCount
    });
    
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json({ error: 'Failed to fetch user statistics' }, { status: 500 });
  }
} 