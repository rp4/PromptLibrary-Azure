import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // For security reasons, don't disclose whether the email exists or not
    // Always return a success response even if the email doesn't exist
    if (!user) {
      console.log(`Password reset requested for non-existent email: ${email}`);
      return NextResponse.json(
        { message: 'If your email exists in our system, you will receive password reset instructions.' },
        { status: 200 }
      );
    }

    // In a real application, you would:
    // 1. Generate a reset token
    // 2. Save it to the database with an expiration time
    // 3. Send an email with a link containing the token
    
    // For now, we'll just log that we would send an email
    console.log(`Password reset email would be sent to: ${email}`);
    
    return NextResponse.json(
      { message: 'If your email exists in our system, you will receive password reset instructions.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in password reset API route:', error);
    return NextResponse.json(
      { error: 'Failed to process password reset request. Please try again later.' },
      { status: 500 }
    );
  }
} 