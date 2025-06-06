import { PrismaClient } from '@/generated/prisma';

// Create a global variable to store the prisma instance
let prisma: PrismaClient;

// Initialize Prisma
if (process.env.NODE_ENV === 'production') {
  // In production, use a real PrismaClient
  prisma = new PrismaClient();
} else {
  // In development, prevent multiple instances
  if (!(global as any).prisma) {
    console.log('Initializing PrismaClient...');
    (global as any).prisma = new PrismaClient({
      log: ['query', 'error', 'warn']
    });
    console.log('Using real Prisma client');
  }
  prisma = (global as any).prisma;
}

export default prisma; 