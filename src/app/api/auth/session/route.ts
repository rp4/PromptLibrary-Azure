import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    return NextResponse.json(session || { user: null });
  } catch (error) {
    console.error('Session API error:', error);
    // Return a valid but empty session rather than an error
    return NextResponse.json({ user: null });
  }
} 