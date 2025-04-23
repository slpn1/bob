import { T2iCreateImageOutput } from '../t2i.server';

interface DALLE3Response {
  created: number;
  data: Array<{
    revised_prompt?: string;
    url?: string;
    b64_json?: string;
  }>;
}

interface DALLE3Request {
  prompt: string;
  model: 'dall-e-3';
  n?: number;
  quality?: 'standard' | 'hd';
  response_format?: 'url' | 'b64_json';
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  style?: 'vivid' | 'natural';
}

export async function generateDallE3Image(prompt: string, quality: 'standard' | 'hd', size: '1024x1024' | '1792x1024' | '1024x1792', style: 'vivid' | 'natural'): Promise<T2iCreateImageOutput> {
  const endpoint = process.env.DALL_E_3_ENDPOINT;
  const apiKey = process.env.DALL_E_3_API_KEY;

  if (!endpoint || !apiKey) {
    throw new Error('DALL-E 3 configuration is missing');
  }

  const requestBody: DALLE3Request = {
    prompt,
    model: 'dall-e-3',
    n: 1, // DALL-E 3 only supports 1 image at a time
    quality,
    response_format: 'b64_json',
    size,
    style,
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DALL-E 3 API error: ${error}`);
    }

    const result: DALLE3Response = await response.json();
    const [width, height] = size.split('x').map(n => parseInt(n));

    if (!result.data?.[0]?.b64_json) {
      throw new Error('No image data received from DALL-E 3');
    }

    return {
      mimeType: 'image/png',
      base64Data: result.data[0].b64_json,
      altText: result.data[0].revised_prompt || prompt,
      width,
      height,
      generatorName: 'dall-e-3',
      parameters: {
        model: 'dall-e-3',
        quality,
        size,
        style,
      },
      generatedAt: new Date().toISOString(),
    };
  } catch (error: any) {
    throw new Error(`DALL-E 3 generation failed: ${error.message}`);
  }
} 