// --- FILE: app/api/download/route.ts ---

import { NextRequest, NextResponse } from 'next/server';
import { getKhHeaders, isUrlAllowed } from '../_shared/khinsider';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');

  if (!url) {
    return new NextResponse(JSON.stringify({ error: 'URL required' }), { status: 400 });
  }

  if (!isUrlAllowed(url)) {
    console.warn(`[Blocked] Download Proxy Attempt: ${url}`);
    return new NextResponse(JSON.stringify({ error: 'Forbidden: Domain not allowed' }), { status: 403 });
  }

  try {
    const targetUrl = decodeURIComponent(url);
    const headers = new Headers(getKhHeaders(targetUrl));

    const range = req.headers.get('range');
    if (range) headers.set('Range', range);

    const upstream = await fetch(targetUrl, {
      headers: headers,
      redirect: 'follow',
      signal: req.signal,
      // @ts-ignore
      duplex: 'half'
    });

    if (!upstream.ok && upstream.status !== 206) {
      return new NextResponse(JSON.stringify({ error: `Upstream Error: ${upstream.status}` }), { status: upstream.status });
    }

    const resHeaders = new Headers(upstream.headers);
    resHeaders.set('Access-Control-Allow-Origin', '*');
    resHeaders.set('Cross-Origin-Resource-Policy', 'cross-origin');

    resHeaders.delete('Content-Encoding');
    resHeaders.delete('Content-Security-Policy');
    resHeaders.delete('X-Frame-Options');

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: resHeaders,
    });

  } catch (e: any) {
    if (e.name === 'AbortError') return new NextResponse(null, { status: 499 });
    console.error("Download Proxy Error:", e);
    return new NextResponse(JSON.stringify({ error: 'Download failed' }), { status: 500 });
  }
}