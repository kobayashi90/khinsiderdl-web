import { NextRequest, NextResponse } from 'next/server';


export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://downloads.khinsider.com/';

function getProxyHeaders(req: NextRequest) {
  const headers = new Headers();


  headers.set('Referer', BASE_URL);
  headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');


  headers.set('Accept-Encoding', 'identity');

  const range = req.headers.get('range');
  if (range) headers.set('Range', range);

  return headers;
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');

  if (!url) {
    return new NextResponse(JSON.stringify({ error: 'URL required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const targetUrl = decodeURIComponent(url);


    const upstream = await fetch(targetUrl, {
      headers: getProxyHeaders(req),
      redirect: 'follow',

      signal: req.signal,
      // @ts-ignore - Node.js fetch optimization for streams
      duplex: 'half'
    });

    if (!upstream.ok && upstream.status !== 206) {
      return new NextResponse(JSON.stringify({ error: `Upstream Error: ${upstream.status}` }), {
        status: upstream.status
      });
    }


    const resHeaders = new Headers(upstream.headers);


    resHeaders.set('Access-Control-Allow-Origin', '*');
    resHeaders.set('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Content-Disposition, Accept-Ranges');
    resHeaders.set('Cross-Origin-Resource-Policy', 'cross-origin');


    resHeaders.delete('Content-Encoding');
    resHeaders.delete('Content-Security-Policy');
    resHeaders.delete('X-Frame-Options');


    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: resHeaders,
    });

  } catch (e: any) {

    if (e.name === 'AbortError') {
      return new NextResponse(null, { status: 499 });
    }
    console.error("Download Error:", e);
    return new NextResponse(JSON.stringify({ error: 'Download failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function HEAD(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) return new NextResponse(null, { status: 400 });

  try {
    const targetUrl = decodeURIComponent(url);
    const upstream = await fetch(targetUrl, {
      method: 'HEAD',
      headers: getProxyHeaders(req),
      redirect: 'follow',
      signal: req.signal,
    });

    const resHeaders = new Headers(upstream.headers);
    resHeaders.set('Access-Control-Allow-Origin', '*');
    resHeaders.set('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
    resHeaders.set('Cross-Origin-Resource-Policy', 'cross-origin');

    return new NextResponse(null, {
      status: upstream.status,
      headers: resHeaders,
    });
  } catch (e) {
    return new NextResponse(null, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}