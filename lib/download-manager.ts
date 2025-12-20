export class EventBus {
    listeners: Record<string, Function[]>;
    constructor() {
        this.listeners = {};
    }
    on(event: string, callback: Function) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
    }
    off(event: string, callback: Function) {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
    emit(event: string, data?: any) {
        if (this.listeners[event]) this.listeners[event].forEach(cb => cb(data));
    }
}

export class DownloadManager extends EventBus {
    queue: any[];
    active: any[];
    completed: any[];
    errors: any[];
    concurrency: number;
    qualityPref: string;
    isProcessing: boolean;
    resolveCache: Map<string, any>;
    worker: Worker | null;
    lastEmit: number;

    constructor() {
        super();
        this.queue = [];
        this.active = [];
        this.completed = [];
        this.errors = [];
        this.concurrency = 1;
        this.qualityPref = 'best';
        this.isProcessing = false;
        this.resolveCache = new Map();
        this.worker = null;
        this.lastEmit = 0;

        if (typeof window !== 'undefined') {
            this.worker = new Worker('/worker.js');
            this.worker.onmessage = (e) => this.handleMessage(e);
        }
    }
    initializeQuality() {
        if (typeof window !== 'undefined') {
            this.qualityPref = localStorage.getItem('quality') || 'best';
        }
    }
    setQuality(q: string) {
        this.qualityPref = q;
        localStorage.setItem('quality', q);
    }
    async resolveTrackFormats(url: string) {
        if (this.resolveCache.has(url)) {
            return this.resolveCache.get(url);
        }
        const res = await fetch(`/api/resolve?url=${encodeURIComponent(url)}`);
        if (!res.ok) throw new Error(`Resolve failed: ${res.status}`);
        const data = await res.json();
        this.resolveCache.set(url, data);
        return data;
    }
    pickDirectUrl(formats: Record<string, string>) {
        const pref = this.qualityPref || 'best';
        const pick = (k: string) => formats?.[k] || null;
        if (pref === 'flac') return pick('flac');
        if (pref === 'mp3') return pick('mp3');
        if (pref === 'm4a') return pick('m4a') || pick('aac');
        return pick('flac') || pick('m4a') || pick('mp3') || pick('ogg') || formats?.directUrl || null;
    }
    addTrackToQueue(track: any, meta: any) {
        const id = Math.random().toString(36).substr(2, 9);
        const item = {
            id,
            type: 'track',
            track,
            meta,
            status: 'pending',
            progress: 0,
            statusText: 'Waiting...',
            addedAt: Date.now(),
            qualityPref: this.qualityPref
        };
        this.queue.push(item);
        this.emit('update', this.getState());
        this.processQueue();
    }
    addAlbumToQueue(meta: any) {
        const id = Math.random().toString(36).substr(2, 9);
        const item = {
            id,
            type: 'album',
            meta,
            tracks: meta.tracks,
            status: 'pending',
            progress: 0,
            statusText: 'Waiting...',
            addedAt: Date.now(),
            trackProgressMap: {},
            currentTrackIndex: -1,
            qualityPref: this.qualityPref
        };
        this.queue.push(item);
        this.emit('update', this.getState());
        this.processQueue();
    }
    cancel(id: string) {
        let idx = this.queue.findIndex(i => i.id === id);
        if (idx > -1) {
            this.queue.splice(idx, 1);
            this.emit('update', this.getState());
            return;
        }
        const activeItem = this.active.find(i => i.id === id);
        if (activeItem) {
            this.active = this.active.filter(i => i.id !== id);
            this.emit('update', this.getState());
            this.processQueue();
        }
    }
    processQueue() {
        if (this.active.length < this.concurrency && this.queue.length > 0) {
            const item = this.queue.shift();
            item.status = 'downloading';
            this.active.push(item);
            this.emit('update', this.getState());
            if (this.worker) this.worker.postMessage(item);
        }
    }
    handleMessage(e: MessageEvent) {
        const { id, status, progress, text, blob, fileName, error, trackProgressMap } = e.data;
        const item = this.active.find(i => i.id === id);
        if (!item) return;

        if (status === 'progress') {
            item.progress = progress;
            item.statusText = text;
            if (trackProgressMap) item.trackProgressMap = trackProgressMap;

            const now = Date.now();
            if (now - this.lastEmit > 32) {
                this.emit('itemUpdate', item);
                this.lastEmit = now;
            }
        } else if (status === 'complete') {
            this.active = this.active.filter(i => i.id !== id);
            item.status = 'completed';
            item.progress = 100;
            this.completed.unshift(item);
            if (this.completed.length > 50) this.completed.pop();
            this.emit('update', this.getState());

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            this.processQueue();
        } else if (status === 'error') {
            this.active = this.active.filter(i => i.id !== id);
            item.status = 'error';
            item.error = error;
            this.errors.unshift(item);
            this.emit('update', this.getState());
            this.processQueue();
        }
    }
    getState() {
        return {
            queue: [...this.queue],
            active: [...this.active],
            completed: [...this.completed],
            errors: [...this.errors]
        };
    }
    retry(id: string) {
        const errIdx = this.errors.findIndex(i => i.id === id);
        if (errIdx > -1) {
            const item = this.errors.splice(errIdx, 1)[0];
            item.status = 'pending';
            item.progress = 0;
            item.error = null;
            this.queue.push(item);
            this.emit('update', this.getState());
            this.processQueue();
        }
    }
    clearCompleted() {
        this.completed = [];
        this.errors = [];
        this.emit('update', this.getState());
    }
}

export const dlManager = new DownloadManager();
