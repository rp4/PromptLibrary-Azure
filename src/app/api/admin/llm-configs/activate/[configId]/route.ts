import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUserSession, SessionUser } from '@/lib/auth';
import type { Prisma } from '@/generated/prisma'; // Import Prisma namespace for TransactionClient type

// PUT: Activate an LLM configuration (admin only)
export async function PUT(request: Request, { params }: { params: { configId: string } }) {
  try {
    const callingUser: SessionUser | null = await getCurrentUserSession();
    if (!callingUser || callingUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { configId } = params;

    if (!configId) {
      return NextResponse.json({ error: 'Config ID is required' }, { status: 400 });
    }

    // Check if the configuration to activate exists
    const configToActivate = await prisma.lLMConfiguration.findUnique({
        where: { id: configId },
    });

    if (!configToActivate) {
        return NextResponse.json({ error: 'LLM Configuration not found' }, { status: 404 });
    }

    // Using a transaction to ensure atomicity: 
    // 1. Deactivate all other active configurations.
    // 2. Activate the specified configuration.
    const transactionResult = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Deactivate any currently active configuration(s)
      await tx.lLMConfiguration.updateMany({
        where: {
          is_active: true,
          NOT: { id: configId }, // Don't try to deactivate the one we are about to activate if it's already active
        },
        data: { is_active: false },
      });

      // Activate the specified configuration
      const activatedConfig = await tx.lLMConfiguration.update({
        where: { id: configId },
        data: { is_active: true },
      });

      return activatedConfig;
    });

    return NextResponse.json(transactionResult);

  } catch (err: any) {
    console.error(`An unexpected error occurred while activating LLM config ${params.configId}:`, err);
    // Handle Prisma P2025 for record not found if findUnique or the update within transaction fails on a non-existent ID
    // Note: findUnique above should catch it first, but good to be aware.
    if (err.code === 'P2025') { 
        return NextResponse.json({ error: 'LLM Configuration not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 