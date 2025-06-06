/**
 * Authentication Configuration
 * 
 * This file contains all authentication-related settings.
 * Edit this file to configure your authentication providers and settings.
 */

module.exports = {
  // NextAuth.js Configuration
  nextAuth: {
    // Secret used to encrypt cookies and tokens (required in production)
    // Generate a good secret using: `openssl rand -base64 32`
    secret: process.env.NEXTAUTH_SECRET || 'REPLACE_WITH_A_SECURE_SECRET_KEY',
    
    // Session configuration
    session: {
      strategy: 'jwt',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    
    // Providers configuration - uncomment and configure as needed
    providers: {
      // Credentials provider (username/password)
      credentials: {
        enabled: true,
      },
      
      // OAuth providers - uncomment and configure as needed
      google: {
        enabled: false,
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      },
      github: {
        enabled: false,
        clientId: process.env.GITHUB_CLIENT_ID || '',
        clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      },
      /*
      auth0: {
        enabled: false,
        clientId: process.env.AUTH0_CLIENT_ID || '',
        clientSecret: process.env.AUTH0_CLIENT_SECRET || '',
        issuer: process.env.AUTH0_ISSUER || '',
      },
      */
    },
    
    // URLs for custom auth pages (optional)
    pages: {
      signIn: '/auth/signin',
      // signOut: '/auth/signout',
      // error: '/auth/error',
      // verifyRequest: '/auth/verify-request',
      // newUser: '/auth/new-user'
    },
  },
  
  // Supabase Configuration (if used as an alternative)
  // supabase: {
  //   enabled: false,
  //   url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  //   anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  // },
  
  // Development mode settings
  development: {
    // Whether to enable mock users in development
    mockUsers: true,
    // Mock users for development testing
    mockUserCredentials: [
      { email: 'admin@example.com', password: 'password', role: 'admin' },
      { email: 'user@example.com', password: 'password', role: 'user' }
    ],
  }
}; 