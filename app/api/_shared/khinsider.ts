import { load } from 'cheerio';

export const runtime = 'nodejs';

export const BASE_URL = 'https://downloads.khinsider.com';

export const FL_HEADERS: Record<string, string> = {
  Referer: BASE_URL,
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

export function cleanText(t: string | null | undefined) {
  return t ? t.replace(/\s+/g, ' ').trim() : null;
}

export function json(data: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (!headers.has('Access-Control-Allow-Origin')) headers.set('Access-Control-Allow-Origin', '*');
  return new Response(JSON.stringify(data), { ...init, headers });
}

export async function fetchHtml(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`Upstream returned ${res.status}`);
  return await res.text();
}

export function cheerioLoad(html: string) {
  return load(html);
}









