import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Subgroup } from '@/generated/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Handle both groupId and group_id query parameters for flexibility
    const groupId = searchParams.get('groupId') || searchParams.get('group_id');
    
    // Return all subgroups if no groupId is specified
    if (!groupId) {
      const subgroups = await prisma.subgroup.findMany({
        orderBy: {
          order_id: 'asc'
        }
      });
      
      // Format subgroups to match expected frontend structure
      const formattedSubgroups = subgroups.map((subgroup: Subgroup) => ({
        id: subgroup.id,
        name: subgroup.name,
        group_id: subgroup.groupId,
        order_id: subgroup.order_id || 0,
        created_at: subgroup.createdAt,
        updated_at: subgroup.updatedAt
      }));
      
      return NextResponse.json(formattedSubgroups);
    }
    
    // If groupId is specified, filter subgroups by group
    const subgroups = await prisma.subgroup.findMany({
      where: {
        groupId: groupId
      },
      orderBy: {
        order_id: 'asc'
      }
    });
    
    // Format subgroups to match expected frontend structure
    const formattedSubgroups = subgroups.map((subgroup: Subgroup) => ({
      id: subgroup.id,
      name: subgroup.name,
      group_id: subgroup.groupId,
      order_id: subgroup.order_id || 0,
      created_at: subgroup.createdAt,
      updated_at: subgroup.updatedAt
    }));
    
    return NextResponse.json(formattedSubgroups);
  } catch (error) {
    console.error('Error in subgroups API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subgroups' },
      { status: 500 }
    );
  }
} 