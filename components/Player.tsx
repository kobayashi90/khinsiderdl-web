import React, { useRef, useEffect, useState } from 'react';
import { Icon } from './Icon';
import { MedievalSpinner } from './MedievalSpinner';

export const Player = ({
    track, isPlaying, duration, onPlayPause, onToggleMode, mode,
    volume, onVolumeChange, playbackRate, onPlaybackRateChange, onNext, onPrev,
    albumArt, albumTitle, onClose, isLoading, onDownload, onAlbumClick, audioRef,
    isMobileFullScreen, setMobileFullScreen, isLiked, onLike
}: any) => {

    const sliderRef = useRef<HTMLInputElement>(null);
    const mobileSliderRef = useRef<HTMLInputElement>(null);
    const progressBarRef = useRef<HTMLDivElement>(null);
    const mobileProgressBarRef = useRef<HTMLDivElement>(null);
    const timeCurrRef = useRef<HTMLSpanElement>(null);
    const mobileTimeCurrRef = useRef<HTMLSpanElement>(null);
    const rafRef = useRef<number | null>(null);
    const isDraggingRef = useRef(false);


    const formatTime = (seconds: number) => {
        if (!seconds || isNaN(seconds)) return "0:00";
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };


    useEffect(() => {
        const audio = audioRef?.current;
        if (!audio) return;

        const updateUI = () => {
            const time = audio.currentTime;
            const dur = audio.duration || 1;
            const percent = (time / dur) * 100;


            const fmt = formatTime(time);
            if (timeCurrRef.current) timeCurrRef.current.innerText = fmt;
            if (mobileTimeCurrRef.current) mobileTimeCurrRef.current.innerText = fmt;


            if (progressBarRef.current) progressBarRef.current.style.width = `${percent}%`;
            if (mobileProgressBarRef.current) mobileProgressBarRef.current.style.width = `${percent}%`;


            if (!isDraggingRef.current) {
                if (sliderRef.current) {
                    sliderRef.current.value = time.toString();
                    sliderRef.current.style.backgroundSize = `${percent}% 100%`;
                }
                if (mobileSliderRef.current) {
                    mobileSliderRef.current.value = time.toString();
                    mobileSliderRef.current.style.backgroundSize = `${percent}% 100%`;
                }
            }

            if (isPlaying) {
                rafRef.current = requestAnimationFrame(updateUI);
            }
        };

        if (isPlaying) {
            rafRef.current = requestAnimationFrame(updateUI);
        } else {

            updateUI();
        }

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [isPlaying, audioRef]);


    const handleSeekStart = () => {
        isDraggingRef.current = true;
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        const dur = duration || 1;
        const percent = (val / dur) * 100;


        e.target.style.backgroundSize = `${percent}% 100%`;


        const fmt = formatTime(val);
        if (timeCurrRef.current) timeCurrRef.current.innerText = fmt;
        if (mobileTimeCurrRef.current) mobileTimeCurrRef.current.innerText = fmt;
    };

    const handleSeekEnd = (e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) => {
        isDraggingRef.current = false;
        if (audioRef?.current) {
            const val = parseFloat((e.target as HTMLInputElement).value);
            audioRef.current.currentTime = val;
        }
    };

    const handleMobileBarClick = (e: React.MouseEvent) => {
        if (window.innerWidth <= 768) {
            setMobileFullScreen(true);
        } else {
            onToggleMode();
        }
    };

    if (!track) return null;

    return (
        <>
            <div className={`mobile-player-overlay ${isMobileFullScreen ? 'active' : ''}`}>
                <div className="mp-header">
                    <button className="mp-close-btn" onClick={() => setMobileFullScreen(false)}>
                        <Icon name="chevronDown" size={32} />
                    </button>
                </div>

                <div className="mp-art-container">
                    {albumArt ? (
                        <img src={`/api/image?url=${encodeURIComponent(albumArt)}`} className="mp-art" />
                    ) : (
                        <div className="mp-art" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a110a', color: '#8a7a6a' }}>
                            <Icon name="headphones" size={64} />
                        </div>
                    )}
                </div>

                <div className="mp-info">
                    <div className="mp-title">{track.title}</div>
                    <div
                        className="mp-album"
                        onClick={() => { setMobileFullScreen(false); if (onAlbumClick) onAlbumClick(); }}
                        style={{ cursor: 'pointer' }}
                    >
                        {albumTitle}
                    </div>
                </div>

                <div className="mp-progress">
                    <input
                        ref={mobileSliderRef}
                        type="range"
                        min="0"
                        max={duration || 0}
                        step="0.1"
                        defaultValue="0"
                        onChange={handleSeek}
                        onMouseDown={handleSeekStart}
                        onMouseUp={handleSeekEnd}
                        onTouchStart={handleSeekStart}
                        onTouchEnd={handleSeekEnd}
                        className="seek-slider"
                        style={{ width: '100%' }}
                    />
                    <div className="mp-time-labels">
                        <span ref={mobileTimeCurrRef}>0:00</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>

                <div className="mp-controls">
                    <button className="mp-btn" onClick={onPrev}><Icon name="skipBack" size={32} /></button>
                    <button className="mp-btn-main" onClick={onPlayPause}>
                        {isLoading ? <MedievalSpinner className="spinner-svg small" /> : <Icon name={isPlaying ? "pause" : "play"} size={32} />}
                    </button>
                    <button className="mp-btn" onClick={onNext}><Icon name="skipFwd" size={32} /></button>
                </div>

                {onLike && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                        <button className="mp-btn" onClick={onLike} style={{ color: isLiked ? 'var(--c-crimson)' : '#e2d6b5' }}>
                            <Icon name={isLiked ? "heartFilled" : "heart"} size={28} />
                        </button>
                    </div>
                )}

                <div className="mp-sliders">
                    <div className="mp-slider-group">
                        <Icon name="volume" size={20} />
                        <input
                            type="range"
                            min="0" max="1" step="0.05"
                            value={volume}
                            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                            className="vol-slider"
                            style={{ flex: 1, backgroundSize: `${volume * 100}% 100%` }}
                        />
                    </div>
                    <div className="mp-slider-group">
                        <span className="speed-label" style={{ width: 'auto' }}>{playbackRate}x</span>
                        <input
                            type="range"
                            min="0.5" max="2.0" step="0.1"
                            value={playbackRate}
                            onChange={(e) => onPlaybackRateChange(parseFloat(e.target.value))}
                            className="speed-slider"
                            style={{ flex: 1, backgroundSize: `${((playbackRate - 0.5) / 1.5) * 100}% 100%` }}
                        />
                    </div>
                </div>
            </div>

            <div className={`medieval-player player-${mode}`} onClick={handleMobileBarClick}>
                <div className="player-toggle-btn desktop-only" onClick={(e) => { e.stopPropagation(); onToggleMode(); }}>
                    <Icon name={mode === 'standard' ? 'chevronDown' : 'chevronUp'} size={20} />
                </div>

                <div className="player-progress-container mobile-only">
                    <div ref={mobileProgressBarRef} className="player-progress-bar" style={{ width: '0%' }}></div>
                </div>

                <div className="player-content-standard">
                    <div className="p-info">
                        {albumArt ? (
                            <img src={`/api/image?url=${encodeURIComponent(albumArt)}`} className="p-art" />
                        ) : (
                            <div className="p-art" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a110a' }}>
                                <Icon name="headphones" size={24} />
                            </div>
                        )}
                        <div className="p-meta">
                            <div className="p-title" title={track.title}>{track.title}</div>
                            <div
                                className={`p-subtitle ${onAlbumClick ? 'interactive' : ''}`}
                                title={albumTitle}
                                onClick={(e) => { e.stopPropagation(); if (onAlbumClick) onAlbumClick(); }}
                            >
                                {albumTitle || "Unknown Album"}
                            </div>
                        </div>
                    </div>

                    <div className="p-center-wrapper">
                        <div className="p-controls">
                            <button className="p-btn" onClick={(e) => { e.stopPropagation(); onPrev(); }} title="Previous"><Icon name="skipBack" size={20} /></button>
                            <button className="p-btn p-btn-main" onClick={(e) => { e.stopPropagation(); onPlayPause(); }}>
                                {isLoading ? <MedievalSpinner className="spinner-svg small" /> : <Icon name={isPlaying ? "pause" : "play"} size={22} />}
                            </button>
                            <button className="p-btn" onClick={(e) => { e.stopPropagation(); onNext(); }} title="Next"><Icon name="skipFwd" size={20} /></button>
                        </div>
                        <div className="player-progress-desktop desktop-only">
                            <span ref={timeCurrRef} className="time-curr">0:00</span>
                            <input
                                ref={sliderRef}
                                type="range"
                                min="0"
                                max={duration || 0}
                                step="0.1"
                                defaultValue="0"
                                onChange={handleSeek}
                                onMouseDown={handleSeekStart}
                                onMouseUp={handleSeekEnd}
                                className="seek-slider"
                                onClick={(e) => e.stopPropagation()}
                            />
                            <span className="time-dur">{formatTime(duration)}</span>
                        </div>
                    </div>

                    <div className="p-extras">
                        {onLike && (
                            <button className="p-btn" onClick={(e) => { e.stopPropagation(); onLike(); }} title={isLiked ? "Unlike" : "Like"} style={{ marginRight: '0.5rem', color: isLiked ? 'var(--c-crimson)' : 'inherit' }}>
                                <Icon name={isLiked ? "heartFilled" : "heart"} size={20} />
                            </button>
                        )}

                        {onDownload && (
                            <button className="p-btn" onClick={(e) => { e.stopPropagation(); onDownload(); }} title="Download Track" style={{ marginRight: '0.5rem' }}>
                                <Icon name="download" size={20} />
                            </button>
                        )}

                        <div className="p-settings">
                            <div className="p-speed" title="Playback Speed">
                                <span className="speed-label">{playbackRate}x</span>
                                <input
                                    type="range"
                                    min="0.5" max="2.0" step="0.1"
                                    value={playbackRate}
                                    onChange={(e) => onPlaybackRateChange(parseFloat(e.target.value))}
                                    className="speed-slider"
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ backgroundSize: `${((playbackRate - 0.5) / 1.5) * 100}% 100%` }}
                                />
                                <button
                                    className="p-btn p-btn-reset"
                                    onClick={(e) => { e.stopPropagation(); onPlaybackRateChange(1.0); }}
                                    title="Reset Speed to 1x"
                                    style={{ opacity: playbackRate === 1.0 ? 0.3 : 1 }}
                                >
                                    <Icon name="refresh" size={14} />
                                </button>
                            </div>
                            <div className="p-volume" title="Volume">
                                <Icon name="volume" size={18} />
                                <input
                                    type="range"
                                    min="0" max="1" step="0.05"
                                    value={volume}
                                    onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                                    className="vol-slider"
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ backgroundSize: `${volume * 100}% 100%` }}
                                />
                            </div>
                        </div>

                        <button className="p-btn p-btn-close" onClick={(e) => { e.stopPropagation(); onClose(); }} title="Close Player">
                            <Icon name="close" size={20} />
                        </button>
                    </div>
                </div>
                <div className="player-content-mini" onClick={(e) => { if (e.target === e.currentTarget) onToggleMode(); }}>
                    <div className="mini-text">
                        <span style={{ fontWeight: 'bold' }}>{track.title}</span>
                        <span style={{ opacity: 0.7, fontSize: '0.8em', fontFamily: 'Mate SC' }}>
                            {

                            }
                            Playing
                        </span>
                    </div>
                </div>
            </div>
        </>
    );
};