import { NextRequest, NextResponse } from 'next/server';
import { env } from '../../../src/server/env';

export async function POST(request: NextRequest) {
  console.log('[KC API] Knowledge Central API called via App Router');
  
  try {
    const body = await request.json();
    console.log('[KC API] Processing POST request, body:', body);

    // Get environment variables
    const kcEndpoint = env.KC_ENDPOINT;
    const kcApiKey = env.KC_API_KEY;
    
    console.log('[KC API] Environment check - Endpoint:', kcEndpoint ? 'Set' : 'Not set', 'API Key:', kcApiKey ? 'Set' : 'Not set');

    if (!kcEndpoint || !kcApiKey) {
      console.log('[KC API] Missing environment variables');
      return NextResponse.json(
        { error: 'Knowledge Central endpoint or API key not configured' },
        { status: 500 }
      );
    }

    console.log('[KC API] Making request to Knowledge Central endpoint');
    
    // Make the request to Knowledge Central
    const response = await fetch(kcEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${kcApiKey}`,
      },
      body: JSON.stringify(body),
    });

    console.log('[KC API] Response from Knowledge Central - Status:', response.status);

    if (!response.ok) {
      throw new Error(`Knowledge Central API error: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json();
    console.log('[KC API] Response data received:', responseData);
    
    // Extract the chat_output from the response
    const chatOutput = responseData.chat_output || '';
    console.log('[KC API] Extracted chat_output, length:', chatOutput.length);
    
    return new NextResponse(chatOutput, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    });

  } catch (error: any) {
    console.error('[KC API] Error in Knowledge Central API:', error);
    return NextResponse.json(
      { error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
} 