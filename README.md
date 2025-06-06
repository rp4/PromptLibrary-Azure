# Prompt Library

A library for managing and using prompts for AI applications.

## Authentication Configuration

This project includes a separate configuration file for authentication settings, making it easy to customize when you install or fork the repository.

### Basic Setup

1. Rename `.env.example` to `.env.local` (if it exists) and update environment variables.
2. Open `auth-config.js` in the root directory to configure authentication.

### Authentication Options

The `auth-config.js` file allows you to configure:

#### NextAuth.js (Default)

```javascript
// Configure NextAuth.js
nextAuth: {
  // Your secret key (required in production)
  secret: process.env.NEXTAUTH_SECRET || 'your-secret-key',
  
  // Session configuration
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  // Authentication providers
  providers: {
    // Enable/disable and configure credential login
    credentials: {
      enabled: true,
    },
    
    // OAuth providers - enable and configure as needed
    google: {
      enabled: false,
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    },
    github: {
      enabled: false,
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    }
  }
}
```

### Environment Variables

For production, set these environment variables:

- `NEXTAUTH_SECRET`: A secure random string for JWT encryption
- `NEXTAUTH_URL`: Your site URL (e.g., https://example.com)

If using OAuth providers:
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`

### Development Mode

For development testing, you can enable mock users:

```javascript
development: {
  mockUsers: true,
  mockUserCredentials: [
    { email: 'admin@example.com', password: 'password', role: 'admin' },
    { email: 'user@example.com', password: 'password', role: 'user' }
  ],
}
```

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Configure authentication in `auth-config.js`
4. Run the development server: `npm run dev`

## Additional Documentation

[Add links to any additional documentation here] 