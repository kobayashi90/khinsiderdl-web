import React from 'react';
import { Icon } from './Icon';

export const TrackRow = React.memo(({ t, i, isCurrent, isPlaying, trackProgress, playTrack, addToQueue, selectedAlbumTracks, isLiked, onLike }: any) => {
    return (
        <div className={`track-row ${isCurrent && isPlaying ? 'is-playing' : ''}`}>
            {isCurrent && <div className="track-playing-indicator"></div>}
            {trackProgress !== undefined && (
                <div className="track-progress-fill" style={{ width: `${trackProgress}%` }}></div>
            )}
            <div className="t-num">{t.number || i + 1}</div>
            <div className="t-title" onClick={() => playTrack(t, selectedAlbumTracks)}>
                {t.title}
                {trackProgress > 0 && trackProgress < 100 && (
                    <span style={{ marginLeft: '10px', fontSize: '0.8em', color: 'var(--c-gold)', fontFamily: 'Mate SC' }}>
                        {Math.round(trackProgress)}%
                    </span>
                )}
            </div>
            {t.bitrate && <div className="t-bitrate">{t.bitrate}</div>}
            <div className="t-dur">{t.duration}</div>
            {t.fileSize && <div className="t-size">{t.fileSize}</div>}
            <div className="t-act">
                {onLike && (
                    <button className="btn-mini" onClick={() => onLike(t)} title={isLiked ? "Unlike" : "Like"}>
                        <Icon name={isLiked ? "heartFilled" : "heart"} size={14} />
                    </button>
                )}
                <button
                    className="btn-mini"
                    onClick={() => playTrack(t, selectedAlbumTracks)}
                    title={isCurrent && isPlaying ? "Pause" : "Play"}
                >
                    <Icon name={isCurrent && isPlaying ? "pause" : "play"} size={14} />
                </button>
                <button className="btn-mini" onClick={() => addToQueue(t)} title="Download Track">
                    <Icon name="download" size={14} />
                </button>
            </div>
        </div>
    );
});

TrackRow.displayName = 'TrackRow';