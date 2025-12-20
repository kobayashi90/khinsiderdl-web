import { FL_HEADERS, cleanText, cheerioLoad, json, BASE_URL } from '../_shared/khinsider';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  if (!url) return json({ error: 'URL required' }, { status: 400 });

  try {
    const response = await fetch(url, { headers: FL_HEADERS });
    if (!response.ok) throw new Error(`Khinsider returned ${response.status}`);

    const html = await response.text();
    const $ = cheerioLoad(html);
    const pageContent = $('#pageContent').html() || '';

    const meta: any = {
      name: $('h2').first().text().trim(),
      year: null,
      developers: null,
      composers: null,
      catalogNumber: null,
      publisher: null,
      totalFilesize: null,
      dateAdded: null,
      platforms: [] as string[],
      availableFormats: [] as string[],
      description: null,
      relatedAlbums: [] as any[],
      coverUrl: null,
      albumImages: [] as string[],
      tracks: [] as any[],
    };

    const getMeta = (label: string) => {
      const regex = new RegExp(`<b>${label}:?</b>\\s*([^<]+)`, 'i');
      const match = pageContent.match(regex);
      return match ? cleanText(match[1]) : null;
    };

    meta.year = getMeta('Year');
    meta.developers = getMeta('Developed by');
    meta.catalogNumber = getMeta('Catalog Number');
    meta.publisher = getMeta('Published by');
    meta.totalFilesize = getMeta('Total Filesize');
    meta.dateAdded = getMeta('Date Added');

    meta.composers = getMeta('Composed by') || getMeta('Performed by');
    if (!meta.composers) {
      const descMatch = pageContent.match(/Composed by ([^<]+?)<br/i);
      if (descMatch) meta.composers = descMatch[1].replace(/&amp;/g, '&').trim();
    }

    $('.albuminfo a[href*="game-soundtracks"]').each((i, el) => {
      const href = $(el).attr('href') || '';
      if (!href.includes('/album/')) meta.platforms.push($(el).text());
    });
    meta.platforms = [...new Set(meta.platforms)];

    const descHeader = $('h2').filter((i, el) => $(el).text().includes('Description'));
    if (descHeader.length) {
      let description = '';
      let next = descHeader.next();
      while (next.length && !next.is('h2')) {
        description += next.text() + '\n';
        next = next.next();
      }
      meta.description = cleanText(description);
    }

    const relatedHeader = $('h2').filter((i, el) => $(el).text().includes('also viewed'));
    if (relatedHeader.length) {
      relatedHeader
        .next('table')
        .find('td')
        .each((i, el) => {
          const a = $(el).find('a').first();
          const img = $(el).find('img').attr('src');
          if (a.length) {
            meta.relatedAlbums.push({
              title: cleanText(a.text()),
              url: BASE_URL + (a.attr('href') || ''),
              thumb: img ? (img.startsWith('http') ? img : BASE_URL + img) : null,
            });
          }
        });
    }

    const images: string[] = [];
    $('.albumImage a').each((i, el) => {
      let href = $(el).attr('href');
      if (href) {
        if (!href.startsWith('http')) href = BASE_URL + href;
        images.push(href);
      }
    });
    meta.albumImages = [...new Set(images)];
    meta.coverUrl = meta.albumImages.length > 0 ? meta.albumImages[0] : null;

    const headers: string[] = [];
    $('#songlist tr')
      .first()
      .find('th')
      .each((i, el) => {
        headers.push((cleanText($(el).text()) || '').toLowerCase());
      });
    meta.availableFormats = headers.filter((h) => !!h && !['#', 'song name', 'play', 'time', 'size'].includes(h));

    let trackCounter = 1;
    $('#songlist tr').each((i, el) => {
      if ($(el).attr('id')) return;

      const tds = $(el).find('td');
      if (tds.length < 2) return;

      const anchor = $(el)
        .find('a')
        .filter((idx, a) => {
          const h = $(a).attr('href');
          return typeof h === 'string' && h.includes('/game-soundtracks/album/');
        })
        .first();

      if (!anchor.length) return;

      const title = cleanText(anchor.text());
      const href = anchor.attr('href') || '';
      const url = BASE_URL + href;

      const number = trackCounter++;

      let duration: string | null = null;
      let fileSize: string | null = null;
      let bitrate: string | null = null;

      tds.each((j, td) => {
        const txt = $(td).text().trim();
        if (/^\d+:\d{2}(:\d{2})?$/.test(txt)) duration = txt;
        else if (/\d+(\.\d+)?\s*(MB|KB|GB)/i.test(txt)) fileSize = txt;
        else if (/\d+\s*k(bps)?/i.test(txt)) bitrate = txt;
      });

      meta.tracks.push({
        number,
        title,
        duration: duration || '--:--',
        fileSize: fileSize || '',
        bitrate,
        url,
      });
    });

    return json(meta);
  } catch (e: any) {
    return json({ error: e?.message || 'Album fetch failed' }, { status: 500 });
  }
}


