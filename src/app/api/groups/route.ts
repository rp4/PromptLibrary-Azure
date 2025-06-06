import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Group, Subgroup } from '@/generated/prisma';

export async function GET() {
  try {
    // Get groups from database with subgroups
    const groups = await prisma.group.findMany({
      include: {
        subgroups: true
      },
      orderBy: {
        order_id: 'asc'
      }
    });
    
    // Format groups to match expected frontend structure
    const formattedGroups = groups.map((group: Group & { subgroups: Subgroup[] }) => ({
      id: group.id,
      name: group.name,
      order_id: group.order_id || 0,
      created_at: group.createdAt,
      updated_at: group.updatedAt,
      subgroups: group.subgroups.map((subgroup: Subgroup) => ({
        id: subgroup.id,
        name: subgroup.name,
        group_id: subgroup.groupId,
        order_id: subgroup.order_id || 0,
        created_at: subgroup.createdAt,
        updated_at: subgroup.updatedAt
      }))
    }));
    
    return NextResponse.json(formattedGroups);
  } catch (error) {
    console.error('Error in groups API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch groups' },
      { status: 500 }
    );
  }
} 