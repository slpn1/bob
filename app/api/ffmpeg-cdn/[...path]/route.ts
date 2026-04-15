// Proxies ffmpeg.wasm assets from unpkg so they're served same-origin to the browser.
// Required for: (a) constructing Workers from same-origin URLs, and (b) letting the
// ESM worker's relative imports resolve through the same proxy.
// Next.js `rewrites()` struggles with the `@` in @ffmpeg package paths, so we use an
// explicit route handler instead.

export const runtime = 'edge';

const UPSTREAM = 'https://unpkg.com';

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const upstreamUrl = `${UPSTREAM}/${path.map(encodeURIComponent).join('/')}`;

  const upstream = await fetch(upstreamUrl, { redirect: 'follow' });
  if (!upstream.ok)
    return new Response(`Upstream ${upstream.status}: ${upstreamUrl}`, { status: upstream.status });

  // Pass through body with the upstream Content-Type, and a long cache.
  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') ?? 'application/octet-stream',
      'Cache-Control': 'public, max-age=86400, immutable',
    },
  });
}
