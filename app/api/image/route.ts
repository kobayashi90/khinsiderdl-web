import { getKhHeaders, isUrlAllowed } from '../_shared/khinsider';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) return new Response('No URL', { status: 400 });

  if (!isUrlAllowed(url)) {
    return new Response('Forbidden: Domain not allowed', { status: 403 });
  }

  try {

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const imgRes = await fetch(url, {
      headers: getKhHeaders(url),
      signal: controller.signal,
      cache: 'no-store'
    });

    clearTimeout(timeoutId);

    if (!imgRes.ok) return new Response('Image fetch failed', { status: imgRes.status });

    return new Response(imgRes.body, {
      headers: {
        'Content-Type': imgRes.headers.get('content-type') || 'application/octet-stream',
        'Cache-Control': 'public, max-age=604800, immutable',
        'Access-Control-Allow-Origin': '*',
        'Cross-Origin-Resource-Policy': 'cross-origin',
      },
    });
  } catch (error) {
    console.error("Image Proxy Error:", error);
    return new Response('Internal Server Error', { status: 500 });
  }
}