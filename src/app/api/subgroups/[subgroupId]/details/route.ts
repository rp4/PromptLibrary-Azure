import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { subgroupId: string } }
) {
  try {
    const subgroupId = params.subgroupId;
    
    // Get the subgroup details from database
    const subgroup = await prisma.subgroup.findFirst({
      where: { id: subgroupId }
    });
    
    if (!subgroup) {
      return NextResponse.json(
        { error: 'Subgroup not found' },
        { status: 404 }
      );
    }
    
    // Count the number of prompts in this subgroup
    const promptCount = await prisma.legacyPrompt.count({
      where: { subgroupId: subgroupId }
    });
    
    // Default description and icon if not in database
    const description = `Prompts for ${subgroup.name}`;
    const icon = 'default-icon';
    
    // Return the subgroup with prompt count and formatted data
    return NextResponse.json({
      id: subgroup.id,
      name: subgroup.name,
      description,
      icon,
      promptCount,
      group_id: subgroup.groupId,
      order_id: subgroup.order_id || 0,
      created_at: subgroup.createdAt,
      updated_at: subgroup.updatedAt
    });
  } catch (error) {
    console.error('Error in subgroup details API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subgroup details' },
      { status: 500 }
    );
  }
} 