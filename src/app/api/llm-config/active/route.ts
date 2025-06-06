import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUserSession, SessionUser } from '@/lib/auth';

// GET: Fetch the currently active LLM configuration (authenticated users)
export async function GET(request: Request) {
  try {
    const callingUser: SessionUser | null = await getCurrentUserSession();
    // Ensure the user is authenticated, but any role can access the active config.
    if (!callingUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); // 401 for not authenticated
    }

    const activeConfig = await prisma.lLMConfiguration.findFirst({
      where: { is_active: true },
    });

    if (!activeConfig) {
      return NextResponse.json({ error: 'No active LLM configuration found.' }, { status: 404 });
    }

    // The `default_parameters` field is a string (JSON stringified). 
    // The client will need to parse it if it needs to be an object.
    return NextResponse.json(activeConfig);

  } catch (err: any) {
    console.error('An unexpected error occurred while fetching the active LLM config:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 