import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
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

export async function GET(
  request: Request,
  { params }: { params: { promptId: string } }
) {
  try {
    const promptId = params.promptId;
    console.log(`GET request for prompt ID: ${promptId}`);
    
    // Get the prompt from database
    const prompt = await prisma.legacyPrompt.findUnique({
      where: { id: promptId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    if (!prompt) {
      console.log(`Prompt with ID ${promptId} not found`);
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }
    
    // Format the prompt to match the expected structure in the frontend
    const formattedPrompt = {
      id: prompt.id,
      title: prompt.title,
      prompt_text: prompt.prompt_text,
      notes: prompt.notes,
      subgroup_id: prompt.subgroupId,
      user_id: prompt.createdById,
      created_at: prompt.createdAt ? new Date(prompt.createdAt).toISOString() : null,
      updated_at: prompt.updatedAt ? new Date(prompt.updatedAt).toISOString() : null,
      creator: prompt.creator,
      favorites_count: prompt.favorites_count || 0
    };
    
    return NextResponse.json(formattedPrompt);
  } catch (error) {
    console.error('Error fetching prompt:', error);
    return NextResponse.json(
      { error: `Failed to fetch prompt: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { promptId: string } }
) {
  try {
    const promptId = params.promptId;
    console.log(`PUT request for prompt ID: ${promptId}`);
    
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
      console.log('Request body:', body);
      
      // Extract data from the JSON request
      title = body.title;
      promptText = body.content || body.prompt_text;
      notes = body.notes;
      subgroupId = body.subgroup_id;
    }
    
    // Validate each required field and log what's missing
    const missingFields = [];
    if (!title) missingFields.push('title');
    if (!promptText) missingFields.push('prompt_text/content');
    if (!subgroupId) missingFields.push('subgroup_id');
    
    if (missingFields.length > 0) {
      const errorMessage = `Missing required fields: ${missingFields.join(', ')}`;
      console.error(errorMessage);
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }
    
    // Check if prompt exists
    const existingPrompt = await prisma.legacyPrompt.findUnique({
      where: { id: promptId }
    });
    
    if (!existingPrompt) {
      console.log(`Prompt with ID ${promptId} not found for update`);
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }
    
    // If subgroup is changing, get the new group ID
    let groupId = existingPrompt.groupId;
    if (subgroupId && subgroupId !== existingPrompt.subgroupId) {
      groupId = await getGroupIdFromSubgroup(subgroupId);
      console.log(`Subgroup changed from ${existingPrompt.subgroupId} to ${subgroupId}. New group ID: ${groupId}`);
    }
    
    // Update data
    const updateData: any = {
      title,
      prompt_text: promptText,
      updatedAt: new Date()
    };

    if (notes !== undefined) {
      updateData.notes = notes;
    }
    
    if (subgroupId) {
      updateData.subgroupId = subgroupId;
      updateData.groupId = groupId;
    }
    
    // Handle uploaded files metadata
    if (uploadedFiles.length > 0) {
      // If we have existing metadata as a string, parse it first
      let existingMetadata: PromptMetadata = {};
      if (existingPrompt.metadata) {
        try {
          existingMetadata = JSON.parse(existingPrompt.metadata as string) as PromptMetadata;
        } catch (e) {
          console.error('Error parsing existing metadata:', e);
        }
      }
      
      // Update the documents array in the metadata
      const newMetadata: PromptMetadata = {
        ...existingMetadata,
        documents: [
          ...(existingMetadata.documents || []),
          ...uploadedFiles
        ]
      };
      
      // Store the metadata as a JSON string
      updateData.metadata = JSON.stringify(newMetadata);
    }
    
    console.log('Updating prompt with data:', updateData);
    
    // Update the prompt in the database
    const updatedPrompt = await prisma.legacyPrompt.update({
      where: { id: promptId },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    console.log('Successfully updated prompt:', updatedPrompt);
    
    // Parse metadata for the response if it exists
    let parsedMetadata = null;
    if (updatedPrompt.metadata) {
      try {
        parsedMetadata = JSON.parse(updatedPrompt.metadata as string);
      } catch (e) {
        console.error('Error parsing metadata for response:', e);
      }
    }
    
    // Return the updated prompt
    return NextResponse.json({
      id: updatedPrompt.id,
      title: updatedPrompt.title,
      prompt_text: updatedPrompt.prompt_text,
      notes: updatedPrompt.notes,
      metadata: parsedMetadata,
      subgroup_id: updatedPrompt.subgroupId,
      user_id: updatedPrompt.createdById,
      created_at: updatedPrompt.createdAt ? new Date(updatedPrompt.createdAt).toISOString() : null,
      updated_at: updatedPrompt.updatedAt ? new Date(updatedPrompt.updatedAt).toISOString() : null,
      creator: updatedPrompt.creator,
      favorites_count: updatedPrompt.favorites_count || 0
    });
  } catch (error) {
    console.error('Error updating prompt:', error);
    return NextResponse.json(
      { error: `Failed to update prompt: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { promptId: string } }
) {
  try {
    const promptId = params.promptId;
    console.log(`DELETE request for prompt ID: ${promptId}`);
    
    // Check if prompt exists
    const existingPrompt = await prisma.legacyPrompt.findUnique({
      where: { id: promptId }
    });
    
    if (!existingPrompt) {
      console.log(`Prompt with ID ${promptId} not found for deletion`);
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }
    
    // Delete the prompt from the database
    await prisma.legacyPrompt.delete({
      where: { id: promptId }
    });
    
    console.log(`Successfully deleted prompt with ID ${promptId}`);
    
    // Return success response
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting prompt:', error);
    return NextResponse.json(
      { error: `Failed to delete prompt: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

// Helper function to get the group ID from a subgroup ID
async function getGroupIdFromSubgroup(subgroupId: string): Promise<string> {
  console.log(`Looking up group ID for subgroup: ${subgroupId}`);
  
  const subgroup = await prisma.subgroup.findFirst({
    where: { id: subgroupId },
    select: { groupId: true }
  });
  
  if (!subgroup) {
    const errorMessage = `Subgroup with ID ${subgroupId} not found`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
  
  console.log(`Found group ID ${subgroup.groupId} for subgroup ${subgroupId}`);
  return subgroup.groupId;
} 