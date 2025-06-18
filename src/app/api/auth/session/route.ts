import { NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth/next'; // No longer needed for this temporary fix
// import { authOptions } from '../[...nextauth]/route'; // No longer needed for this temporary fix

export async function GET() {
  // TEMPORARY: Bypass auth and return admin session directly from this custom route
  console.log('TEMPORARY (session/route.ts): Bypassing auth, returning admin session.');
  const adminSession = {
    user: {
      id: 'cmbidzebz0000vdnk6wimoox6',
      email: 'test@example.com',
      name: 'Test User', // This should now appear in the UI
      role: 'admin',
    }
    // If your client-side session handling expects an 'expires' property on the session object itself:
    // expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // e.g., 30 days from now
  };
  return NextResponse.json(adminSession);
}