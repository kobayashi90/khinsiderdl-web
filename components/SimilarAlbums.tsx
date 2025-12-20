import React, { useRef, useEffect } from 'react';
import { SimilarAlbumCard } from './SimilarAlbumCard';

export const SimilarAlbums = ({ albums, onSelect }: { albums: any[]; onSelect: (album: any) => void }) => {
    const carouselRef = useRef<HTMLDivElement>(null);
    const scrollRequestRef = useRef<number | null>(null);
    const scrollSpeedRef = useRef(0);
    const lastTimeRef = useRef(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!carouselRef.current) return;
        const rect = carouselRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        const hotZone = width * 0.2;


        if (x < hotZone) {

            const factor = (hotZone - x) / hotZone;
            scrollSpeedRef.current = -factor * 6;
        } else if (x > width - hotZone) {

            const factor = (x - (width - hotZone)) / hotZone;
            scrollSpeedRef.current = factor * 6;
        } else {
            scrollSpeedRef.current = 0;
        }
    };

    const handleMouseLeave = () => {
        scrollSpeedRef.current = 0;
    };

    useEffect(() => {
        const scroll = (time: number) => {
            if (lastTimeRef.current === 0) lastTimeRef.current = time;


            if (Math.abs(scrollSpeedRef.current) > 0.1 && carouselRef.current) {
                const maxScroll = carouselRef.current.scrollWidth - carouselRef.current.clientWidth;

                const currentScroll = carouselRef.current.scrollLeft;

                if ((scrollSpeedRef.current > 0 && currentScroll < maxScroll) ||
                    (scrollSpeedRef.current < 0 && currentScroll > 0)) {
                    carouselRef.current.scrollLeft += scrollSpeedRef.current;
                }
            }
            lastTimeRef.current = time;
            scrollRequestRef.current = requestAnimationFrame(scroll);
        };

        scrollRequestRef.current = requestAnimationFrame(scroll);
        return () => {
            if (scrollRequestRef.current) {
                cancelAnimationFrame(scrollRequestRef.current);
            }
        };
    }, []);

    return (
        <div className="related-albums">
            <h3 className="f-header" style={{ marginTop: '2rem' }}>Similar Albums</h3>
            <div
                className="album-carousel"
                ref={carouselRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                {albums.map((alb, i) => (
                    <SimilarAlbumCard key={i} album={alb} onSelect={onSelect} />
                ))}
            </div>
        </div>
    );
};
