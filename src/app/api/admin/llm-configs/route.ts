import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUserSession, SessionUser } from '@/lib/auth';

// GET: List all LLM configurations (admin only)
export async function GET(request: Request) {
  try {
    const callingUser: SessionUser | null = await getCurrentUserSession();
    if (!callingUser || callingUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const configs = await prisma.lLMConfiguration.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(configs);

  } catch (err: any) {
    console.error('An unexpected error occurred while fetching LLM configs:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Create a new LLM configuration (admin only)
export async function POST(request: Request) {
  try {
    const callingUser: SessionUser | null = await getCurrentUserSession();
    if (!callingUser || callingUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    let {
      config_name,
      api_type,
      api_base_url,
      api_key_env_var,
      model_name,
      default_parameters, // This might be an object or a string from the client
      is_active = false
    } = body;

    if (!config_name || !api_type || !api_key_env_var || !model_name) {
      return NextResponse.json({ error: 'Missing required fields: config_name, api_type, api_key_env_var, model_name' }, { status: 400 });
    }

    // Ensure default_parameters is a string for database storage
    let defaultParametersString: string | null = null;
    if (default_parameters) {
      if (typeof default_parameters === 'object') {
        try {
          defaultParametersString = JSON.stringify(default_parameters);
        } catch (e) {
          return NextResponse.json({ error: 'Invalid JSON format for default_parameters' }, { status: 400 });
        }
      } else if (typeof default_parameters === 'string') {
        // Validate if it's a valid JSON string if it's already a string
        try {
          JSON.parse(default_parameters);
          defaultParametersString = default_parameters;
        } catch (e) {
          return NextResponse.json({ error: 'Invalid JSON string for default_parameters' }, { status: 400 });
        }
      } else {
        return NextResponse.json({ error: 'default_parameters must be an object or a valid JSON string' }, { status: 400 });
      }
    }

    if (is_active) {
      // Deactivate all other configurations if this one is being set to active
      await prisma.lLMConfiguration.updateMany({
        where: { is_active: true },
        data: { is_active: false },
      });
    }

    const newConfig = await prisma.lLMConfiguration.create({
      data: {
        config_name,
        api_type,
        api_base_url: api_base_url || null,
        api_key_env_var,
        model_name,
        default_parameters: defaultParametersString,
        is_active,
      },
    });

    return NextResponse.json(newConfig, { status: 201 });

  } catch (err: any) {
    console.error('An unexpected error occurred while creating LLM config:', err);
    if (err.name === 'SyntaxError') { // From request.json()
        return NextResponse.json({ error: 'Invalid JSON payload in request' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 