import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUserSession, SessionUser } from '@/lib/auth';

// PUT: Update an existing LLM configuration (admin only)
export async function PUT(request: Request, { params }: { params: { configId: string } }) {
  try {
    const callingUser: SessionUser | null = await getCurrentUserSession();
    if (!callingUser || callingUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { configId } = params;
    const body = await request.json();
    let {
      config_name,
      api_type,
      api_base_url,
      api_key_env_var,
      model_name,
      default_parameters, // Can be object or string
      is_active
    } = body;

    if (!configId) {
      return NextResponse.json({ error: 'Config ID is required' }, { status: 400 });
    }

    // Ensure default_parameters is stored as a string or null
    let defaultParametersString: string | undefined | null = undefined;
    if (default_parameters !== undefined) { // Only process if it's part of the request
      if (default_parameters === null) {
        defaultParametersString = null;
      } else if (typeof default_parameters === 'object') {
        try {
          defaultParametersString = JSON.stringify(default_parameters);
        } catch (e) {
          return NextResponse.json({ error: 'Invalid JSON format for default_parameters' }, { status: 400 });
        }
      } else if (typeof default_parameters === 'string') {
        try {
          JSON.parse(default_parameters); // Validate
          defaultParametersString = default_parameters;
        } catch (e) {
          return NextResponse.json({ error: 'Invalid JSON string for default_parameters' }, { status: 400 });
        }
      } else {
        return NextResponse.json({ error: 'default_parameters must be an object, a valid JSON string, or null' }, { status: 400 });
      }
    }

    // Prepare data for update, only including fields that are present in the request
    const updateData: any = {};
    if (config_name !== undefined) updateData.config_name = config_name;
    if (api_type !== undefined) updateData.api_type = api_type;
    if (api_base_url !== undefined) updateData.api_base_url = api_base_url;
    if (api_key_env_var !== undefined) updateData.api_key_env_var = api_key_env_var;
    if (model_name !== undefined) updateData.model_name = model_name;
    if (defaultParametersString !== undefined) updateData.default_parameters = defaultParametersString; // Will be null if explicitly set to null
    if (is_active !== undefined) updateData.is_active = is_active;

    if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ error: 'No update fields provided' }, { status: 400 });
    }

    if (is_active === true) {
      // If this config is being set to active, deactivate all others first.
      // Note: This means there could be a brief moment no config is active if the update fails.
      // For more robustness, a transaction could be used if your DB supports it well with Prisma operations.
      await prisma.lLMConfiguration.updateMany({
        where: {
          is_active: true,
          id: { not: configId }, // Don't deactivate itself if it's already active and being updated
        },
        data: { is_active: false },
      });
    }

    const updatedConfig = await prisma.lLMConfiguration.update({
      where: { id: configId },
      data: updateData,
    });

    return NextResponse.json(updatedConfig);

  } catch (err: any) {
    console.error(`An unexpected error occurred while updating LLM config ${params.configId}:`, err);
    if (err.name === 'SyntaxError') { // From request.json()
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
    // Handle Prisma P2025 for record not found during update
    if (err.code === 'P2025') { 
        return NextResponse.json({ error: 'LLM Configuration not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Delete an LLM configuration (admin only)
export async function DELETE(request: Request, { params }: { params: { configId: string } }) {
  try {
    const callingUser: SessionUser | null = await getCurrentUserSession();
    if (!callingUser || callingUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { configId } = params;

    if (!configId) {
      return NextResponse.json({ error: 'Config ID is required' }, { status: 400 });
    }

    // Optional: Check if the config to be deleted is active. 
    // The frontend should probably handle warning the user.
    // const configToDelete = await prisma.lLMConfiguration.findUnique({ where: { id: configId } });
    // if (configToDelete && configToDelete.is_active) {
    //   Could return a specific message or require deactivation first, but for now, allow deletion.
    // }

    await prisma.lLMConfiguration.delete({
      where: { id: configId },
    });

    return NextResponse.json({ message: 'LLM Configuration deleted successfully' }, { status: 200 }); // Or 204 No Content

  } catch (err: any) {
    console.error(`An unexpected error occurred while deleting LLM config ${params.configId}:`, err);
    // Handle Prisma P2025 for record not found during delete
    if (err.code === 'P2025') { 
        return NextResponse.json({ error: 'LLM Configuration not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 