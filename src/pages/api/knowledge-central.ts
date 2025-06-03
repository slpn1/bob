import type { NextApiRequest, NextApiResponse } from 'next';
import { env } from '../../server/env';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[KC API] Knowledge Central API called with method:', req.method);
  
  if (req.method !== 'POST') {
    console.log('[KC API] Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('[KC API] Processing POST request, body:', req.body);

  try {
    // Get environment variables
    const kcEndpoint = env.KC_ENDPOINT;
    const kcApiKey = env.KC_API_KEY;
    
    console.log('[KC API] Environment check - Endpoint:', kcEndpoint ? 'Set' : 'Not set', 'API Key:', kcApiKey ? 'Set' : 'Not set');

    if (!kcEndpoint || !kcApiKey) {
      console.log('[KC API] Missing environment variables');
      return res.status(500).json({ error: 'Knowledge Central endpoint or API key not configured' });
    }

    console.log('[KC API] Making request to Knowledge Central endpoint');
    
    // Make the request to Knowledge Central
    const response = await fetch(kcEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${kcApiKey}`,
      },
      body: JSON.stringify(req.body),
    });

    console.log('[KC API] Response from Knowledge Central - Status:', response.status);

    if (!response.ok) {
      throw new Error(`Knowledge Central API error: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.text();
    console.log('[KC API] Response data received, length:', responseData.length);
    
    res.status(200).send(responseData);

  } catch (error: any) {
    console.error('[KC API] Error in Knowledge Central API:', error);
    res.status(500).json({ error: error.message || 'Unknown error' });
  }
} 