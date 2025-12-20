import { FL_HEADERS } from '../_shared/khinsider';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  if (!url) return new Response('No URL', { status: 400 });

  try {
    const imgRes = await fetch(url, { headers: FL_HEADERS });
    return new Response(imgRes.body, {
      headers: {
        'Content-Type': imgRes.headers.get('content-type') || 'application/octet-stream',
        'Cross-Origin-Resource-Policy': 'cross-origin',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return new Response('Error', { status: 500 });
  }
}


