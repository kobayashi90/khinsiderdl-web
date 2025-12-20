export class KhinsiderAPI {
    private albumCache = new Map<string, any>();
    async search(query: string) {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error("Search Failed");
        return await res.json();
    }
    async getAlbum(url: string, signal: AbortSignal) {
        if (this.albumCache.has(url)) {
            return this.albumCache.get(url);
        }
        const res = await fetch(`/api/album?url=${encodeURIComponent(url)}`, { signal });
        if (!res.ok) throw new Error("Metadata Failed");
        const data = await res.json();
        this.albumCache.set(url, data);
        return data;
    }
    async getLatest() {
        try {
            const proxyUrl = `/api/download?url=${encodeURIComponent('https://downloads.khinsider.com/rss')}`;
            const res = await fetch(proxyUrl);
            if (!res.ok) throw new Error("RSS Fetch Failed");
            const text = await res.text();
            const parser = new DOMParser();
            const xml = parser.parseFromString(text, "text/xml");
            const items = Array.from(xml.querySelectorAll("item"));
            return items.map(item => ({
                title: item.querySelector("title")?.textContent || "Unknown",
                url: item.querySelector("Link")?.textContent || item.querySelector("link")?.textContent || "",
                date: item.querySelector("pubDate")?.textContent || ""
            }));
        } catch (e) {
            console.error("RSS Fetch Error", e);
            return [];
        }
    }
}

export const api = new KhinsiderAPI();
