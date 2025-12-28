import React, { useRef, useState } from 'react';
import { SimilarAlbumCard } from './SimilarAlbumCard';
import { Icon } from './Icon';

export const SimilarAlbums = ({ albums, onSelect, deferLoading }: { albums: any[]; onSelect: (album: any) => void; deferLoading?: boolean }) => {
    const [viewMode, setViewMode] = useState<'carousel' | 'grid'>('carousel');
    const carouselRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (carouselRef.current) {
            const scrollAmount = 320;
            carouselRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="related-albums">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 className="f-header" style={{ margin: 0 }}>Similar Albums</h3>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                        className="btn-mini"
                        onClick={() => setViewMode(viewMode === 'carousel' ? 'grid' : 'carousel')}
                        title={viewMode === 'carousel' ? "Switch to Grid" : "Switch to Carousel"}
                    >
                        <Icon name={viewMode === 'carousel' ? "grid" : "list"} size={16} />
                    </button>
                </div>
            </div>

            {viewMode === 'carousel' ? (
                <div style={{ position: 'relative', margin: '0 -1rem' }}>
                    <button className="carousel-nav-btn prev desktop-only" onClick={() => scroll('left')}>
                        <Icon name="chevronLeft" size={20} />
                    </button>
                    <div className="album-carousel" ref={carouselRef}>
                        {albums.map((alb, i) => (
                            <SimilarAlbumCard key={i} album={alb} onSelect={onSelect} deferLoading={deferLoading} />
                        ))}
                    </div>
                    <button className="carousel-nav-btn next desktop-only" onClick={() => scroll('right')}>
                        <Icon name="chevronRight" size={20} />
                    </button>
                </div>
            ) : (
                <div className="similar-albums-grid">
                    {albums.map((alb, i) => (
                        <SimilarAlbumCard key={i} album={alb} onSelect={onSelect} deferLoading={deferLoading} />
                    ))}
                </div>
            )}
        </div>
    );
};