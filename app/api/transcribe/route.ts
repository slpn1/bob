// Proxies audio transcription requests to OpenAI using the server-side
// OPENAI_API_KEY. Kept as a plain route handler (not tRPC) so we can stream
// the multipart upload straight through without base64-encoding into JSON.

const OPENAI_TRANSCRIPTIONS_URL = 'https://api.openai.com/v1/audio/transcriptions';

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey)
    return new Response('OPENAI_API_KEY is not configured on the server.', { status: 500 });

  const contentType = request.headers.get('content-type');
  if (!contentType?.startsWith('multipart/form-data'))
    return new Response('Expected multipart/form-data', { status: 400 });

  const upstream = await fetch(OPENAI_TRANSCRIPTIONS_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      // Preserve the multipart boundary from the incoming request.
      'Content-Type': contentType,
    },
    body: request.body,
    // Node's undici fetch needs this to stream a request body without
    // buffering the whole thing in memory.
    // @ts-expect-error — duplex is valid at runtime but missing from lib types.
    duplex: 'half',
  });

  if (!upstream.ok) {
    const err = await upstream.text().catch(() => upstream.statusText);
    return new Response(`OpenAI transcription failed (${upstream.status}): ${err}`, { status: upstream.status });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: { 'Content-Type': upstream.headers.get('Content-Type') ?? 'text/plain' },
  });
}
