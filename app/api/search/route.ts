import { BASE_URL, FL_HEADERS, cleanText, cheerioLoad, json } from '../_shared/khinsider';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  if (!q) return json({ error: 'Query required' }, { status: 400 });

  try {
    const term = q.replace('series:', '');
    const targetUrl = `${BASE_URL}/search?search=${encodeURIComponent(term)}&albumListSize=compact`;
    const response = await fetch(targetUrl, { headers: FL_HEADERS });
    if (!response.ok) throw new Error(`Khinsider returned ${response.status}`);

    const html = await response.text();
    const $ = cheerioLoad(html);
    const results: Array<{ title: string | null; id: string; icon: string | null; url: string }> = [];

    const pageHeader = $('h2').first().text().trim();
    if (pageHeader && pageHeader !== 'Search' && !pageHeader.includes('Search Results')) {
      const canonical = $('link[rel="canonical"]').attr('href') || response.url;
      results.push({
        title: pageHeader,
        id: canonical.replace(BASE_URL, ''),
        icon: $('.albumImage a img').attr('src') || null,
        url: canonical,
      });
      return json(results);
    }

    $('.albumList tr, #songlist tr').each((i, el) => {
      if (i === 0) return;
      const tds = $(el).find('td');
      if (tds.length < 2) return;

      const titleTd = tds.eq(1);
      const linkTag = titleTd.find('a').first();
      const href = linkTag.attr('href');

      if (href && href.includes('/game-soundtracks/album/')) {
        let iconImg = tds.eq(0).find('img').attr('src') || null;
        if (iconImg && !iconImg.startsWith('http')) iconImg = BASE_URL + iconImg;
        results.push({
          title: cleanText(linkTag.text()),
          id: href,
          icon: iconImg,
          url: BASE_URL + href,
        });
      }
    });

    return json(results);
  } catch (e: any) {
    return json({ error: e?.message || 'Search failed' }, { status: 500 });
  }
}


