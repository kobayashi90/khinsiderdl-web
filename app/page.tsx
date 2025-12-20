'use client';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Script from 'next/script';
import "./globals.css";

import { isUrl, extractPathFromUrl, toTitleCase } from '../lib/utils';
import { api } from '../lib/khinsider-api';
import { dlManager } from '../lib/download-manager';

import { SearchResultItem } from '../components/SearchResultItem';
import { SimilarAlbums } from '../components/SimilarAlbums';
import { AlbumArtStack } from '../components/AlbumArtStack';
import { GalleryModal } from '../components/GalleryModal';
import { Player } from '../components/Player';
import { TrackRow } from '../components/TrackRow';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { QueueView } from '../components/QueueView';
import { SettingsView } from '../components/SettingsView';
import { Icon } from '../components/Icon';

const DISCORD_URL = "https://discord.gg/your-invite-link";

export default function HomePage() {
    const [view, setView] = useState('home');
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [selectedAlbum, setSelectedAlbum] = useState<any>(null);
    const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [qualityPref, setQualityPref] = useState('best');
    const [galleryOpen, setGalleryOpen] = useState(false);
    const [latestUpdates, setLatestUpdates] = useState<any[]>([]);


    const [trackProgress, setTrackProgress] = useState<Record<number, number>>({});
    const [albumProgress, setAlbumProgress] = useState<any>(null);
    const [albumIsQueued, setAlbumIsQueued] = useState(false);
    const [queueCount, setQueueCount] = useState(0);

    const [isClient, setIsClient] = useState(false);
    const [playerMode, setPlayerMode] = useState<'standard' | 'minimized'>('standard');
    const [currentTrack, setCurrentTrack] = useState<any>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isAudioLoading, setIsAudioLoading] = useState(false);
    const [audioDuration, setAudioDuration] = useState(0);
    const [volume, setVolume] = useState(0.8);
    const [playbackRate, setPlaybackRate] = useState(1.0);
    const [queue, setQueue] = useState<any[]>([]);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(-1);
    const [isMobileFullScreen, setMobileFullScreen] = useState(false);


    const [likedTracks, setLikedTracks] = useState<any[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const albumFetchControllerRef = useRef<AbortController | null>(null);
    const isChangingTrackRef = useRef(false);

    const dlUpdateRafRef = useRef<number | null>(null);
    const loadingDebounceRef = useRef<NodeJS.Timeout | null>(null);

    const setAudioLoadingDebounced = useCallback((isLoading: boolean) => {
        if (loadingDebounceRef.current) clearTimeout(loadingDebounceRef.current);

        if (isLoading) {
            setIsAudioLoading(true);
        } else {
            loadingDebounceRef.current = setTimeout(() => {
                setIsAudioLoading(false);
            }, 200);
        }
    }, []);

    useEffect(() => {
        setIsClient(true);
        dlManager.initializeQuality();
        setQualityPref(dlManager.qualityPref);
        api.getLatest().then(setLatestUpdates);

        const savedLikes = localStorage.getItem('kh_liked_songs');
        if (savedLikes) {
            try {
                setLikedTracks(JSON.parse(savedLikes));
            } catch (e) {
                console.error("Failed to parse liked songs", e);
            }
        }

        const savedMode = localStorage.getItem('playerMode');
        if (savedMode === 'minimized' || savedMode === 'standard') {
            setPlayerMode(savedMode);
        }
    }, []);

    useEffect(() => {
        if (isClient) {
            localStorage.setItem('kh_liked_songs', JSON.stringify(likedTracks));
        }
    }, [likedTracks, isClient]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const activeTag = document.activeElement?.tagName;
            if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

            if (e.code === 'Space') {
                e.preventDefault();
                togglePlayPause();
            } else if (e.code === 'ArrowRight') {
                e.preventDefault();
                if (audioRef.current) {
                    audioRef.current.currentTime = Math.min((audioRef.current.duration || 0), audioRef.current.currentTime + 5);
                }
            } else if (e.code === 'ArrowLeft') {
                e.preventDefault();
                if (audioRef.current) {
                    audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 5);
                }
            } else if (e.code === 'ArrowUp') {
                e.preventDefault();
                const newVol = Math.min(1, volume + 0.05);
                setVolume(newVol);
                if (audioRef.current) audioRef.current.volume = newVol;
            } else if (e.code === 'ArrowDown') {
                e.preventDefault();
                const newVol = Math.max(0, volume - 0.05);
                setVolume(newVol);
                if (audioRef.current) audioRef.current.volume = newVol;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isPlaying, volume]);

    useEffect(() => {
        const processState = () => {
            const state = dlManager.getState();
            setQueueCount(state.active.length + state.queue.length);

            if (selectedAlbum) {
                const newProgress: Record<number, number> = {};
                let foundAlbumDownload = null;
                let isQueued = false;

                state.active.forEach((item: any) => {
                    if (item.type === 'track' && item.meta.name === selectedAlbum.name) {
                        const idx = selectedAlbum.tracks.findIndex((t: any) => t.number === item.track.number && t.title === item.track.title);
                        if (idx !== -1) newProgress[idx] = item.progress;
                    }
                    if (item.type === 'album' && item.meta.name === selectedAlbum.name) {
                        foundAlbumDownload = item;
                        if (item.trackProgressMap) {
                            Object.assign(newProgress, item.trackProgressMap);
                        }
                    }
                });

                if (!foundAlbumDownload) {
                    isQueued = state.queue.some((item: any) =>
                        item.type === 'album' && item.meta.name === selectedAlbum.name
                    );
                }

                setTrackProgress(newProgress);
                setAlbumProgress(foundAlbumDownload);
                setAlbumIsQueued(isQueued);
            } else {
                setAlbumProgress(null);
                setAlbumIsQueued(false);
            }
        };

        const handler = () => {
            if (dlUpdateRafRef.current) return;
            dlUpdateRafRef.current = requestAnimationFrame(() => {
                processState();
                dlUpdateRafRef.current = null;
            });
        };

        handler();
        dlManager.on('update', handler);
        dlManager.on('itemUpdate', handler);
        return () => {
            if (dlUpdateRafRef.current) cancelAnimationFrame(dlUpdateRafRef.current);
            dlManager.off('update', handler);
            dlManager.off('itemUpdate', handler);
        };
    }, [selectedAlbum]);

    const handleSearch = async (term: string) => {
        if (!term.trim()) return;
        if (isUrl(term)) {
            const path = extractPathFromUrl(term);
            const albumItem = {
                url: path,
                title: path.split('/').pop() || path,
                icon: '/api/image?url=default-album-icon.jpg'
            };
            selectAlbum(albumItem);
            return;
        }
        if (albumFetchControllerRef.current) {
            albumFetchControllerRef.current.abort();
        }
        setLoading(true);
        setResults([]);
        setSelectedAlbum(null);
        setSelectedUrl(null);
        setView('home');
        try {
            const res = await api.search(term);
            setResults(res);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') handleSearch(query); };

    const handleInputPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        const pastedText = e.clipboardData.getData('text');
        setTimeout(() => {
            if (isUrl(pastedText)) {
                handleSearch(pastedText);
            }
        }, 0);
    };

    const selectAlbum = async (item: any) => {
        if (albumFetchControllerRef.current) {
            albumFetchControllerRef.current.abort();
        }
        setView('home');
        const controller = new AbortController();
        albumFetchControllerRef.current = controller;
        setSelectedUrl(item.url);
        setLoading(true);
        setSelectedAlbum(null);
        setTrackProgress({});
        setAlbumProgress(null);
        setAlbumIsQueued(false);
        try {
            const meta = await api.getAlbum(item.url, controller.signal);
            albumFetchControllerRef.current = null;
            setSelectedAlbum(meta);
        } catch (e: any) {
            if (e.name !== 'AbortError') {
                console.error(e);
            }
        } finally {
            if (!controller.signal.aborted) {
                setLoading(false);
            }
        }
    };

    const handleBack = useCallback(() => {
        setSelectedAlbum(null);
        setSelectedUrl(null);
    }, []);

    const updateQuality = (q: string) => {
        setQualityPref(q);
        dlManager.setQuality(q);
    };



    const addToQueue = useCallback((track: any) => {
        dlManager.addTrackToQueue(track, selectedAlbum);
    }, [selectedAlbum]);

    const downloadFullAlbum = useCallback(() => {
        dlManager.addAlbumToQueue(selectedAlbum);
    }, [selectedAlbum]);


    const handleTrackLike = useCallback((track: any) => {
        const albumContext = selectedAlbum ? {
            name: selectedAlbum.name,
            url: selectedUrl,
            albumImages: selectedAlbum.albumImages
        } : undefined;


        const albumName = albumContext?.name || track.albumName || "Unknown Album";
        const albumUrl = albumContext?.url || track.albumUrl || "";
        const albumArt = albumContext?.albumImages?.[0] || track.albumArt || "";
        const trackData = { ...track, albumName, albumUrl, albumArt };

        setLikedTracks(prev => {
            const exists = prev.find(t => t.url === track.url);
            if (exists) return prev.filter(t => t.url !== track.url);
            return [trackData, ...prev];
        });
    }, [selectedAlbum, selectedUrl]);


    const toggleLike = useCallback((track: any) => {
        setLikedTracks(prev => {
            const exists = prev.find(t => t.url === track.url);
            if (exists) return prev.filter(t => t.url !== track.url);

            return [track, ...prev];
        });
    }, []);

    const isLiked = useCallback((trackUrl: string) => {
        return likedTracks.some(t => t.url === trackUrl);
    }, [likedTracks]);


    const toggleLikeAlbum = useCallback(() => {
        if (!selectedAlbum) return;
        const tracks = selectedAlbum.tracks;
        const albumTrackUrls = tracks.map((t: any) => t.url);

        const allLiked = tracks.every((t: any) => likedTracks.some(lt => lt.url === t.url));

        if (allLiked) {
            setLikedTracks(prev => prev.filter(t => !albumTrackUrls.includes(t.url)));
        } else {
            const newLikes: any[] = [];
            tracks.forEach((t: any) => {
                if (!likedTracks.some(lt => lt.url === t.url)) {
                    newLikes.push({
                        ...t,
                        albumName: selectedAlbum.name,
                        albumUrl: selectedUrl,
                        albumArt: selectedAlbum.albumImages?.[0]
                    });
                }
            });
            setLikedTracks(prev => [...newLikes, ...prev]);
        }
    }, [selectedAlbum, selectedUrl, likedTracks]);

    const playTrack = useCallback(async (track: any, albumTracks: any[] = []) => {
        if (isChangingTrackRef.current) return;
        isChangingTrackRef.current = true;

        if (!selectedAlbum && !track.albumName) {
            isChangingTrackRef.current = false;
            return;
        }
        const albumName = track.albumName || (selectedAlbum ? selectedAlbum.name : "");
        const albumArt = track.albumArt || (selectedAlbum ? selectedAlbum.albumImages?.[0] : "");
        const albumUrl = selectedUrl || track.albumUrl || "";

        if (currentTrack && currentTrack.title === track.title && currentTrack.albumName === albumName) {
            if (audioRef.current) {
                if (isPlaying) audioRef.current.pause();
                else audioRef.current.play().catch(() => { });
                setIsPlaying(!isPlaying);
            }
            isChangingTrackRef.current = false;
            return;
        }

        let newQueue = [];
        if (albumTracks.length > 0) {
            newQueue = albumTracks.map(t => ({ ...t, albumName, albumArt, albumUrl: t.albumUrl || albumUrl }));
        } else {
            newQueue = [{ ...track, albumName, albumArt, albumUrl }];
        }

        setQueue(newQueue);
        const idx = newQueue.findIndex(t => t.title === track.title);
        setCurrentTrackIndex(idx);

        const trackData = { ...track, albumName, albumArt, albumUrl };
        setCurrentTrack(trackData);
        setIsPlaying(true);
        setAudioLoadingDebounced(true);
        try {
            const formats = await dlManager.resolveTrackFormats(track.url);
            const directUrl = dlManager.pickDirectUrl(formats);
            if (directUrl && audioRef.current) {
                audioRef.current.src = directUrl;
                audioRef.current.volume = volume;
                if ((audioRef.current as any).mozPreservesPitch !== undefined) {
                    (audioRef.current as any).mozPreservesPitch = false;
                } else {
                    (audioRef.current as any).preservesPitch = false;
                }
                const playPromise = audioRef.current.play();
                if (playPromise !== undefined) {
                    playPromise.catch(e => {
                        if (audioRef.current && !audioRef.current.src.includes('/api/download')) {
                            console.warn("Direct playback failed, switching to proxy...");
                            audioRef.current.src = `/api/download?url=${encodeURIComponent(directUrl)}`;
                            audioRef.current.play().catch(err => console.error("Proxy playback failed", err));
                        } else if (e.name !== 'AbortError') {
                            console.error("Playback failed", e);
                        }
                    });
                }
            }
        } catch (e) {
            console.error("Failed to resolve track for streaming", e);
            setIsPlaying(false);
            setAudioLoadingDebounced(false);
        } finally {
            isChangingTrackRef.current = false;
        }
    }, [selectedAlbum, selectedUrl, currentTrack, isPlaying, volume, setAudioLoadingDebounced]);

    const playNext = useCallback(() => {
        if (isChangingTrackRef.current) return;
        if (queue.length === 0 || currentTrackIndex === -1 || currentTrackIndex >= queue.length - 1) return;
        const nextIdx = currentTrackIndex + 1;
        const nextTrack = queue[nextIdx];
        setCurrentTrackIndex(nextIdx);
        playTrackInternal(nextTrack);
    }, [queue, currentTrackIndex, volume]);

    const playPrev = useCallback(() => {
        if (isChangingTrackRef.current) return;
        if (queue.length === 0 || currentTrackIndex <= 0) return;
        const prevIdx = currentTrackIndex - 1;
        const prevTrack = queue[prevIdx];
        setCurrentTrackIndex(prevIdx);
        playTrackInternal(prevTrack);
    }, [queue, currentTrackIndex, volume]);

    const playTrackInternal = async (track: any) => {
        isChangingTrackRef.current = true;
        setCurrentTrack(track);
        setIsPlaying(true);
        setAudioLoadingDebounced(true);
        try {
            const formats = await dlManager.resolveTrackFormats(track.url);
            const directUrl = dlManager.pickDirectUrl(formats);
            if (directUrl && audioRef.current) {
                audioRef.current.src = directUrl;
                audioRef.current.volume = volume;
                audioRef.current.play().catch(console.error);
            }
        } catch {
            setIsPlaying(false);
        } finally {
            isChangingTrackRef.current = false;
        }
    };

    const togglePlayPause = () => {
        if (audioRef.current) {
            if (isPlaying) audioRef.current.pause();
            else audioRef.current.play().catch(() => { });
            setIsPlaying(!isPlaying);
        }
    };
    const handleClosePlayer = () => {
        setCurrentTrack(null);
        setIsPlaying(false);
        setAudioLoadingDebounced(false);
        setMobileFullScreen(false);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = "";
        }
    };

    const handleVolumeChange = (vol: number) => {
        setVolume(vol);
        if (audioRef.current) audioRef.current.volume = vol;
    };
    const handlePlaybackRateChange = (rate: number) => {
        setPlaybackRate(rate);
        if (audioRef.current) {
            audioRef.current.playbackRate = rate;
            if ((audioRef.current as any).mozPreservesPitch !== undefined) {
                (audioRef.current as any).mozPreservesPitch = false;
            } else {
                (audioRef.current as any).preservesPitch = false;
            }
        }
    };
    const cyclePlayerMode = () => {
        const newMode = playerMode === 'standard' ? 'minimized' : 'standard';
        setPlayerMode(newMode);
        localStorage.setItem('playerMode', newMode);
    };

    const handleAlbumClick = (url: string) => {
        if (url) {
            const tempItem = { url, title: 'Unknown', icon: '' };
            selectAlbum(tempItem);
        }
    };

    const exportLikes = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(likedTracks));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "khinsider_liked_songs.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const importLikes = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const imported = JSON.parse(text);
                if (Array.isArray(imported)) {
                    setLikedTracks(prev => {
                        const currentUrls = new Set(prev.map(t => t.url));
                        const newTracks = imported.filter(t => !currentUrls.has(t.url));
                        return [...newTracks, ...prev];
                    });
                    alert(`Imported ${imported.length} songs.`);
                } else {
                    alert("Invalid file format.");
                }
            } catch (err) {
                console.error(err);
                alert("Failed to parse file.");
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    // Helper to group liked tracks by album
    const getGroupedLikes = () => {
        const groups: Record<string, { albumName: string, albumUrl: string, albumArt: string, tracks: any[] }> = {};
        likedTracks.forEach(track => {
            const key = track.albumName || "Unknown Album";
            if (!groups[key]) {
                groups[key] = {
                    albumName: key,
                    albumUrl: track.albumUrl,
                    albumArt: track.albumArt,
                    tracks: []
                };
            }
            groups[key].tracks.push(track);
        });
        Object.values(groups).forEach(g => {
            g.tracks.sort((a, b) => (a.number || 0) - (b.number || 0));
        });
        return Object.values(groups);
    };


    if (!isClient) {
        return (
            <div className="app-root">
                <div className="grimoire-container">
                    <div className="panel-content" style={{ gridColumn: '1 / -1' }}>
                        <LoadingIndicator />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <Script src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js" strategy="lazyOnload" />
            <audio
                ref={audioRef}
                onLoadedMetadata={() => {
                    if (audioRef.current) {
                        audioRef.current.playbackRate = playbackRate;
                        setAudioDuration(audioRef.current.duration);
                    }
                }}
                onEnded={() => { setIsPlaying(false); playNext(); }}
                onPause={() => { setIsPlaying(false); setAudioLoadingDebounced(false); }}
                onPlay={() => { setIsPlaying(true); setAudioLoadingDebounced(false); }}
                onWaiting={() => setAudioLoadingDebounced(true)}
                onCanPlay={() => setAudioLoadingDebounced(false)}
                onLoadStart={() => setAudioLoadingDebounced(true)}
                {...({ referrerPolicy: "no-referrer" } as any)}
            />
            <div className={`app-root ${selectedUrl ? 'mobile-content-view' : 'mobile-index-view'}`}>
                <div className="grimoire-container">
                    <div className="panel-nav">
                        <button className={`nav-item ${view === 'home' ? 'active' : ''}`} onClick={() => setView('home')}>
                            <Icon name="search" size={24} />
                            <span className="f-ui nav-text">Library</span>
                        </button>
                        <button className={`nav-item ${view === 'liked' ? 'active' : ''}`} onClick={() => setView('liked')}>
                            <Icon name="heartFilled" size={24} />
                            <span className="f-ui nav-text">Liked</span>
                        </button>
                        <button className={`nav-item ${view === 'queue' ? 'active' : ''}`} onClick={() => setView('queue')}>
                            <div style={{ position: 'relative' }}>
                                <Icon name="list" size={24} />
                                {queueCount > 0 && <span className="nav-badge">{queueCount}</span>}
                            </div>
                            <span className="f-ui nav-text">Queue</span>
                        </button>
                        <button className={`nav-item ${view === 'settings' ? 'active' : ''}`} onClick={() => setView('settings')}>
                            <Icon name="settings" size={24} />
                            <span className="f-ui nav-text">Settings</span>
                        </button>
                        <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" className="nav-item">
                            <Icon name="discord" size={24} />
                            <span className="f-ui nav-text">Discord</span>
                        </a>
                    </div>
                    <div className="panel-index">
                        <div className="search-header">
                            <h2 className="f-header" style={{ color: '#c5a059', fontSize: '1.1rem', margin: 0, letterSpacing: '0.05em' }}>KHInsider-DL</h2>
                            <div className="search-input-wrapper">
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={handleInputKey}
                                    onPaste={handleInputPaste}
                                    placeholder="Search the library or paste a URL..."
                                    className="search-input"
                                />
                                <div className="search-icon"><Icon name="search" size={16} /></div>
                            </div>
                        </div>
                        <div className="index-list medieval-scroll">
                            {(loading && results.length === 0) ? (
                                <div style={{ padding: '2rem', textAlign: 'center', fontStyle: 'italic', opacity: 0.6 }}>Searching...</div>
                            ) : results.length > 0 ? results.map((item, i) => (
                                <SearchResultItem
                                    key={i}
                                    item={item}
                                    isSelected={selectedUrl === item.url}
                                    onSelect={selectAlbum}
                                    toTitleCase={toTitleCase}
                                />
                            )) : (
                                <div style={{ padding: '2rem', textAlign: 'center', fontStyle: 'italic', opacity: 0.4 }}>No entries found.</div>
                            )}
                        </div>
                    </div>
                    <div className="panel-content medieval-scroll">
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '3.75rem', height: '3.75rem', borderTop: '3px solid #2a1f1b', borderLeft: '3px solid #2a1f1b', opacity: 0.1, borderRadius: '4px 0 0 0', zIndex: 5, pointerEvents: 'none' }}></div>
                        <div style={{ position: 'absolute', top: 0, right: 0, width: '3.75rem', height: '3.75rem', borderTop: '3px solid #2a1f1b', borderRight: '3px solid #2a1f1b', opacity: 0.1, borderRadius: '0 4px 0 0', zIndex: 5, pointerEvents: 'none' }}></div>
                        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '3.75rem', height: '3.75rem', borderBottom: '3px solid #2a1f1b', borderLeft: '3px solid #2a1f1b', opacity: 0.1, borderRadius: '0 0 0 4px', zIndex: 5, pointerEvents: 'none' }}></div>
                        <div style={{ position: 'absolute', bottom: 0, right: 0, width: '3.75rem', height: '3.75rem', borderBottom: '3px solid #2a1f1b', borderRight: '3px solid #2a1f1b', opacity: 0.1, borderRadius: '0 0 4px 0', zIndex: 5, pointerEvents: 'none' }}></div>

                        {loading ? (
                            <LoadingIndicator />
                        ) : view === 'settings' ? (
                            <SettingsView currentQ={qualityPref} onSetQ={updateQuality} />
                        ) : view === 'queue' ? (
                            <QueueView />
                        ) : view === 'liked' ? (
                            <div className="content-inner">
                                <div className="liked-view-header">
                                    <h1 className="f-header" style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: '#c5a059' }}>Liked Songs</h1>
                                    <div className="f-ui" style={{ color: '#8a6a38', marginBottom: '2rem', fontSize: '0.9rem' }}>
                                        {likedTracks.length} Saved Tracks • Stored Locally
                                    </div>
                                    <div className="btn-action-group">
                                        <button className="btn-main" onClick={exportLikes}>
                                            <Icon name="download" size={18} /> Export Likes
                                        </button>
                                        <button className="btn-main" onClick={() => fileInputRef.current?.click()}>
                                            <Icon name="list" size={18} /> Import Likes
                                        </button>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            style={{ display: 'none' }}
                                            accept=".json"
                                            onChange={importLikes}
                                        />
                                    </div>
                                </div>
                                <div className="liked-list">
                                    {likedTracks.length === 0 ? (
                                        <div className="empty-state">
                                            <Icon name="heart" size={48} />
                                            <p style={{ marginTop: '1rem', fontFamily: 'Mate SC' }}>No liked songs yet.</p>
                                        </div>
                                    ) : (
                                        getGroupedLikes().map((group, gIdx) => (
                                            <div key={gIdx} className="liked-album-group">
                                                <div className="liked-album-header" onClick={() => handleAlbumClick(group.albumUrl)} style={{ cursor: 'pointer' }}>
                                                    {group.albumArt ? (
                                                        <img src={`/api/image?url=${encodeURIComponent(group.albumArt)}`} className="thumb" />
                                                    ) : (
                                                        <div className="thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <Icon name="headphones" size={24} />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="f-header" style={{ fontSize: '1.2rem', color: '#c5a059' }}>{group.albumName}</div>
                                                        <div className="f-ui" style={{ fontSize: '0.8rem', opacity: 0.7 }}>{group.tracks.length} tracks</div>
                                                    </div>
                                                </div>
                                                <div className="track-list" style={{ maxHeight: 'none', marginBottom: '2rem', paddingBottom: '0', background: 'none', border: 'none' }}>
                                                    {group.tracks.map((t: any, i: number) => {
                                                        const isCurrent = currentTrack && currentTrack.title === t.title && currentTrack.albumName === group.albumName;
                                                        return (
                                                            <TrackRow
                                                                key={i}
                                                                t={t}
                                                                i={i}
                                                                isCurrent={isCurrent}
                                                                isPlaying={isPlaying}
                                                                trackProgress={0}
                                                                playTrack={playTrack}
                                                                addToQueue={addToQueue}
                                                                selectedAlbumTracks={group.tracks}
                                                                isLiked={isLiked(t.url)}
                                                                onLike={handleTrackLike}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        ) : selectedAlbum ? (
                            <div className="content-inner">
                                <div style={{ position: 'sticky', top: 0, zIndex: 10, paddingBottom: '1rem', pointerEvents: 'none' }}>
                                    <button className="btn-back-floating" onClick={handleBack}>
                                        <Icon name="arrowLeft" size={16} />
                                        Back
                                    </button>
                                </div>
                                <div className="meta-header">
                                    <div className="header-info">
                                        <h1 className="f-header album-title">{selectedAlbum.name}</h1>
                                        {selectedAlbum.composers && <div className="f-ui album-artist">{selectedAlbum.composers}</div>}
                                        <div className="album-metadata-grid">
                                            {selectedAlbum.availableFormats && selectedAlbum.availableFormats.filter((fmt: string) => fmt !== 'CD').map((fmt: string) => (
                                                <span key={fmt} className={`metadata-tag format-${fmt}`}>{fmt.toUpperCase()}</span>
                                            ))}
                                            {selectedAlbum.year && <span className="metadata-tag">{selectedAlbum.year}</span>}
                                            {selectedAlbum.publisher && <span className="metadata-tag">{selectedAlbum.publisher}</span>}
                                            {selectedAlbum.platforms && selectedAlbum.platforms.length > 0 &&
                                                <span className="metadata-tag">{selectedAlbum.platforms.join(', ')}</span>}
                                            {selectedAlbum.totalFilesize && <span className="metadata-tag">{selectedAlbum.totalFilesize}</span>}
                                        </div>
                                        {selectedAlbum.description && (
                                            <div className="f-body description-box medieval-scroll">
                                                {selectedAlbum.description}
                                            </div>
                                        )}
                                        <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                            <button
                                                onClick={downloadFullAlbum}
                                                className="btn-main"
                                                disabled={!!albumProgress || albumIsQueued}
                                                style={{ position: 'relative', overflow: 'hidden' }}
                                            >
                                                {albumProgress && (
                                                    <div style={{
                                                        position: 'absolute', top: 0, left: 0, bottom: 0,
                                                        width: `${albumProgress.progress}%`,
                                                        background: 'rgba(197, 160, 89, 0.3)',
                                                        transition: 'width 0.2s',
                                                        zIndex: 0
                                                    }}></div>
                                                )}
                                                <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    {albumProgress ? (
                                                        <>
                                                            <Icon name="download" size={18} />
                                                            {`Downloading... ${Math.round(albumProgress.progress)}%`}
                                                        </>
                                                    ) : albumIsQueued ? (
                                                        <>
                                                            <Icon name="list" size={18} />
                                                            Queued
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Icon name="download" size={18} />
                                                            Download Album
                                                        </>
                                                    )}
                                                </span>
                                            </button>

                                            <button
                                                className="btn-main"
                                                onClick={toggleLikeAlbum}
                                                title="Like/Unlike Whole Album"
                                            >
                                                <Icon name={selectedAlbum.tracks.every((t: any) => isLiked(t.url)) ? "heartFilled" : "heart"} size={18} />
                                                {selectedAlbum.tracks.every((t: any) => isLiked(t.url)) ? "Liked Album" : "Like Album"}
                                            </button>

                                            <span style={{ fontFamily: 'Mate SC', color: '#8a6a38', fontSize: '1rem' }}>
                                                • {selectedAlbum.tracks.length} Tracks
                                            </span>
                                        </div>
                                    </div>
                                    <AlbumArtStack
                                        images={selectedAlbum.albumImages}
                                        onClick={() => setGalleryOpen(true)}
                                    />
                                </div>
                                <div className="track-list medieval-scroll">
                                    {selectedAlbum.tracks.map((t: any, i: number) => {
                                        const isCurrent = currentTrack && currentTrack.title === t.title && currentTrack.albumName === selectedAlbum.name;
                                        return (
                                            <TrackRow
                                                key={i}
                                                t={t}
                                                i={i}
                                                isCurrent={isCurrent}
                                                isPlaying={isPlaying}
                                                trackProgress={trackProgress[i]}
                                                playTrack={playTrack}
                                                addToQueue={addToQueue}
                                                selectedAlbumTracks={selectedAlbum.tracks}
                                                isLiked={isLiked(t.url)}
                                                onLike={handleTrackLike}
                                            />
                                        );
                                    })}
                                </div>
                                {selectedAlbum.relatedAlbums && selectedAlbum.relatedAlbums.length > 0 &&
                                    <SimilarAlbums albums={selectedAlbum.relatedAlbums} onSelect={selectAlbum} />
                                }
                            </div>
                        ) : (
                            <div className="latest-updates-view" style={{ padding: '2rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid rgba(138, 106, 56, 0.3)', paddingBottom: '1rem' }}>
                                    <Icon name="book" size={32} />
                                    <h2 className="f-header" style={{ margin: 0, fontSize: '2rem', color: '#c5a059' }}>Latest Arrivals</h2>
                                </div>
                                <div className="rss-grid">
                                    {latestUpdates.length === 0 ? (
                                        <div style={{ textAlign: 'center', opacity: 0.5, fontStyle: 'italic' }}>Loading latest releases...</div>
                                    ) : (
                                        latestUpdates.map((item, i) => (
                                            <div key={i} className="rss-item" onClick={() => selectAlbum({ url: item.url })}>
                                                <div className="rss-date">{new Date(item.date).toLocaleDateString()}</div>
                                                <div className="rss-title">{item.title}</div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <Player
                    track={currentTrack}
                    isPlaying={isPlaying}
                    duration={audioDuration}
                    onPlayPause={togglePlayPause}
                    onToggleMode={cyclePlayerMode}
                    mode={playerMode}
                    volume={volume}
                    onVolumeChange={handleVolumeChange}
                    playbackRate={playbackRate}
                    onPlaybackRateChange={handlePlaybackRateChange}
                    onNext={playNext}
                    onPrev={playPrev}
                    albumArt={currentTrack?.albumArt}
                    albumTitle={currentTrack?.albumName}
                    onClose={handleClosePlayer}
                    isLoading={isAudioLoading}
                    onDownload={() => currentTrack && addToQueue(currentTrack)}
                    onAlbumClick={() => currentTrack?.albumUrl && handleAlbumClick(currentTrack.albumUrl)}
                    audioRef={audioRef}
                    isMobileFullScreen={isMobileFullScreen}
                    setMobileFullScreen={setMobileFullScreen}
                    isLiked={currentTrack ? isLiked(currentTrack.url) : false}
                    onLike={() => currentTrack && toggleLike(currentTrack)}
                />
                {galleryOpen && selectedAlbum && (
                    <GalleryModal
                        images={selectedAlbum.albumImages}
                        onClose={() => setGalleryOpen(false)}
                    />
                )}
            </div>
        </>
    );
}