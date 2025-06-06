import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
// For handling file uploads
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

// Type for metadata
interface PromptMetadata {
  documents?: Array<{
    name: string;
    path: string;
    size: number;
    type: string;
  }>;
  [key: string]: any;
}

export async function GET(request: Request) {
  try {
    // Get the URL to extract query parameters
    const { searchParams } = new URL(request.url);
    
    // Handle both subgroupId and subgroup_id query parameters for flexibility
    const subgroupId = searchParams.get('subgroupId') || searchParams.get('subgroup_id');
    
    // Build the query
    const query: any = {
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    };
    
    // Add subgroup filter if specified
    if (subgroupId) {
      query.where = {
        subgroupId: subgroupId
      };
    }
    
    // Get prompts from database with filters
    const prompts = await prisma.legacyPrompt.findMany(query);
    
    // Format the prompts to match the expected structure in the frontend
    const formattedPrompts = prompts.map((prompt: any) => {
      // Ensure dates are valid and properly formatted
      const created_at_iso = prompt.createdAt ? new Date(prompt.createdAt).toISOString() : null;
      const updated_at_iso = prompt.updatedAt ? new Date(prompt.updatedAt).toISOString() : null;
      
      return {
        id: prompt.id,
        title: prompt.title,
        prompt_text: prompt.prompt_text,
        notes: prompt.notes,
        subgroup_id: prompt.subgroupId,
        user_id: prompt.createdById,
        created_at: created_at_iso,
        updated_at: updated_at_iso,
        creator: prompt.creator,
        favorites_count: prompt.favorites_count || 0
      };
    });
    
    return NextResponse.json(formattedPrompts);
  } catch (error) {
    console.error('Error in prompts API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prompts' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  console.log('==== STARTING NEW PROMPT CREATION ====');
  
  try {
    // Check if the request is multipart/form-data
    const contentType = request.headers.get('content-type') || '';
    
    let title, promptText, notes, subgroupId, uploadedFiles = [];
    
    if (contentType.includes('multipart/form-data')) {
      // Handle FormData with file uploads
      const formData = await request.formData();
      console.log('Received FormData request');
      
      // Extract text fields
      title = formData.get('title') as string;
      promptText = formData.get('prompt_text') as string;
      notes = formData.get('notes') as string;
      subgroupId = formData.get('subgroup_id') as string;
      
      // Handle document uploads
      const documents = formData.getAll('documents');
      if (documents && documents.length > 0) {
        console.log(`Received ${documents.length} documents`);
        
        // Create uploads directory if it doesn't exist
        const uploadDir = join(process.cwd(), 'public', 'uploads');
        try {
          await mkdir(uploadDir, { recursive: true });
        } catch (err) {
          console.error('Error creating upload directory:', err);
        }
        
        // Process each file
        for (const doc of documents) {
          if (doc instanceof File) {
            try {
              const fileName = `${uuidv4()}-${doc.name}`;
              const filePath = join(uploadDir, fileName);
              const fileBuffer = Buffer.from(await doc.arrayBuffer());
              
              await writeFile(filePath, fileBuffer);
              console.log(`File saved: ${fileName}`);
              
              uploadedFiles.push({
                name: doc.name,
                path: `/uploads/${fileName}`,
                size: doc.size,
                type: doc.type
              });
            } catch (fileError) {
              console.error('Error saving file:', fileError);
            }
          }
        }
      }
    } else {
      // Handle regular JSON request
      const body = await request.json();
      console.log('Received POST request with body:', body);
      
      // Extract data from the JSON request
      title = body.title;
      promptText = body.content || body.prompt_text;
      notes = body.notes;
      subgroupId = body.subgroup_id;
    }
    
    console.log('Direct subgroup_id from request:', subgroupId);
    
    // Get the current subgroup from query parameters in the request URL
    const url = new URL(request.url);
    const querySubgroupId = url.searchParams.get('subgroupId') || url.searchParams.get('subgroup_id');
    console.log('Query subgroupId from request URL:', querySubgroupId);
    
    // Get the referer URL to extract subgroup if not in query
    const referer = request.headers.get('referer') || '';
    console.log('Request URL:', request.url);
    console.log('Referer URL:', referer);
    
    // Get current user from session - if this fails, we'll catch the error and continue
    let sessionUserId = null;
    try {
      const session = await getServerSession(authOptions);
      console.log('Current session:', session);
      
      // Get user ID from session if available
      if (session?.user?.email) {
        // Look up user by email
        const user = await prisma.user.findUnique({
          where: { email: session.user.email }
        });
        
        if (user) {
          sessionUserId = user.id;
          console.log('Found user ID from session email:', sessionUserId);
        }
      }
    } catch (error) {
      console.log('Error getting session, proceeding without it:', error);
    }
    
    // Determine user_id from session
    let effectiveUserId = sessionUserId;
    
    // Ensure the user exists or create a default user
    if (effectiveUserId) {
      // Check if the user exists
      const userExists = await prisma.user.findUnique({
        where: { id: effectiveUserId }
      });
      
      if (!userExists) {
        console.log(`User with ID ${effectiveUserId} not found, using default user`);
        effectiveUserId = null; // Reset to use default user
      }
    }
    
    // If no valid user ID, get or create the default test user
    if (!effectiveUserId) {
      // Look for test user
      const testUser = await prisma.user.findFirst({
        where: { email: 'test@example.com' }
      });
      
      if (testUser) {
        effectiveUserId = testUser.id;
        console.log('Using existing test user:', effectiveUserId);
      } else {
        // Create a default test user
        const newUser = await prisma.user.create({
          data: {
            email: 'test@example.com',
            name: 'Test User',
            role: 'user'
          }
        });
        effectiveUserId = newUser.id;
        console.log('Created new test user with ID:', effectiveUserId);
      }
    }
    
    console.log('Using user ID:', effectiveUserId);
    
    // Determine subgroup_id - try multiple sources
    let effectiveSubgroupId = subgroupId || querySubgroupId;
    
    // Log the initial determination
    console.log('Initial effectiveSubgroupId determination:', effectiveSubgroupId);
    
    // Extra debug for referer URL parsing
    console.log('Parsing referer URL:', referer);
    
    if (!effectiveSubgroupId) {
      console.log('No subgroup ID in request body or query, checking referer URL');
      
      // Try various patterns for extracting from referer
      // Example patterns:
      // - /prompts?subgroupId=subgroup-1
      // - /prompts/subgroup-1
      
      // Pattern 1: Query parameter
      let urlMatch = referer.match(/[?&]subgroupId=([^&#]+)/);
      if (urlMatch && urlMatch[1]) {
        effectiveSubgroupId = urlMatch[1];
        console.log('Extracted subgroup ID from referer query param:', effectiveSubgroupId);
      } 
      // Pattern 2: Path parameter
      else if (!effectiveSubgroupId) {
        urlMatch = referer.match(/\/prompts\/([^/?&#]+)/);
        if (urlMatch && urlMatch[1]) {
          effectiveSubgroupId = urlMatch[1];
          console.log('Extracted subgroup ID from referer path:', effectiveSubgroupId);
        }
      }
      
      // Try a third pattern: /subgroups/ID
      if (!effectiveSubgroupId) {
        urlMatch = referer.match(/\/subgroups\/([^/?&#]+)/);
        if (urlMatch && urlMatch[1]) {
          effectiveSubgroupId = urlMatch[1];
          console.log('Extracted subgroup ID from /subgroups/ path:', effectiveSubgroupId);
        }
      }
      
      // Try a fourth pattern: /prompts?subgroup=ID
      if (!effectiveSubgroupId) {
        urlMatch = referer.match(/[?&]subgroup=([^&#]+)/);
        if (urlMatch && urlMatch[1]) {
          effectiveSubgroupId = urlMatch[1];
          console.log('Extracted subgroup ID from subgroup query param:', effectiveSubgroupId);
        }
      }
      
      console.log('After referer URL parsing, effectiveSubgroupId:', effectiveSubgroupId);
      
      // If still no subgroup_id, get the first available subgroup
      if (!effectiveSubgroupId) {
        try {
          console.log('Attempting to fetch first subgroup from database');
          const firstSubgroup = await prisma.subgroup.findFirst({
            orderBy: {
              order_id: 'asc'
            }
          });
          
          if (firstSubgroup) {
            effectiveSubgroupId = firstSubgroup.id;
            console.log('Using first available subgroup from database:', effectiveSubgroupId);
          } else {
            console.log('No subgroups found in database, using hardcoded fallback');
            // If database connection is failing, use a hardcoded fallback
            effectiveSubgroupId = 'default-subgroup';
          }
        } catch (dbError) {
          console.error('Database error when fetching subgroups:', dbError);
          console.log('Using hardcoded fallback due to database error');
          // If database access fails, use a hardcoded fallback that's not "subgroup-1"
          effectiveSubgroupId = 'default-subgroup';
        }
      }
    }
    
    // Verify that the subgroup exists, but handle database connection issues
    try {
      console.log('Verifying subgroup exists:', effectiveSubgroupId);
      const subgroupExists = await prisma.subgroup.findUnique({
        where: { id: effectiveSubgroupId }
      });
      
      if (!subgroupExists) {
        console.log(`Subgroup with ID ${effectiveSubgroupId} not found, trying to find first available subgroup`);
        
        const firstSubgroup = await prisma.subgroup.findFirst({
          orderBy: {
            order_id: 'asc'
          }
        });
        
        if (firstSubgroup) {
          effectiveSubgroupId = firstSubgroup.id;
          console.log('Using first available subgroup:', effectiveSubgroupId);
        } else {
          console.log('No subgroups found, using hardcoded value');
          // If no subgroups found, don't default to "subgroup-1" automatically
          effectiveSubgroupId = 'default-subgroup';
        }
      }
    } catch (dbError) {
      console.error('Database error when verifying subgroup:', dbError);
      // Keep current effectiveSubgroupId since we can't verify it
      console.log('Keeping current subgroup ID due to database error:', effectiveSubgroupId);
    }
    
    console.log('Final subgroup ID to be used:', effectiveSubgroupId);
    
    // Validate essential fields
    const missingFields = [];
    if (!title) missingFields.push('title');
    if (!promptText) missingFields.push('prompt_text');
    
    if (missingFields.length > 0) {
      const errorMessage = `Missing required fields: ${missingFields.join(', ')}`;
      console.error(errorMessage);
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }
    
    let groupId;
    // Get the group ID from the subgroup - handle database errors
    try {
      groupId = await getGroupIdFromSubgroup(effectiveSubgroupId);
      console.log(`Found group ID ${groupId} for subgroup ${effectiveSubgroupId}`);
    } catch (error) {
      console.error('Error getting group ID from subgroup:', error);
      // Use a default group ID if database operation fails
      groupId = 'default-group';
      console.log(`Using default group ID ${groupId} due to error`);
    }
    
    // Set current date for createdAt and updatedAt
    const now = new Date();
    
    // Prepare data for creating the prompt
    const promptData: any = {
      title,
      prompt_text: promptText,
      notes,
      subgroupId: effectiveSubgroupId,
      createdById: effectiveUserId,
      groupId,
      favorites_count: 0,
      createdAt: now,
      updatedAt: now
    };

    // If we have documents, add them as metadata
    if (uploadedFiles.length > 0) {
      const metadata: PromptMetadata = {
        documents: uploadedFiles
      };
      promptData.metadata = JSON.stringify(metadata);
    }
    
    console.log('Creating prompt with data:', promptData);
    
    // Create the prompt in the database
    const prompt = await prisma.legacyPrompt.create({
      data: promptData
    });
    
    console.log('Successfully created prompt:', prompt);
    
    // Ensure dates are in valid ISO format for the response
    const createdAt = prompt.createdAt ? new Date(prompt.createdAt).toISOString() : null;
    const updatedAt = prompt.updatedAt ? new Date(prompt.updatedAt).toISOString() : null;
    
    // Return the created prompt
    return NextResponse.json({
      id: prompt.id,
      title: prompt.title,
      prompt_text: prompt.prompt_text,
      notes: prompt.notes,
      subgroup_id: prompt.subgroupId,
      user_id: prompt.createdById,
      created_at: createdAt,
      updated_at: updatedAt,
      metadata: prompt.metadata
    });
  } catch (error) {
    console.error('Error creating prompt:', error);
    return NextResponse.json(
      { error: `Failed to create prompt: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

// Helper function to get the group ID from a subgroup ID
async function getGroupIdFromSubgroup(subgroupId: string): Promise<string> {
  const subgroup = await prisma.subgroup.findFirst({
    where: { id: subgroupId },
    select: { groupId: true }
  });
  
  if (!subgroup) {
    throw new Error(`Subgroup with ID ${subgroupId} not found`);
  }
  
  return subgroup.groupId;
} 