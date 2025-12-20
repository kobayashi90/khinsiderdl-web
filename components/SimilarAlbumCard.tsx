import React, { useRef, useState } from 'react';
import { AutoScrollLabel } from './AutoScrollLabel';

export const SimilarAlbumCard = ({ album, onSelect }: any) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const clipperRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);
    const generateWornClipPath = () => {
        const rough = (val: number, range: number) => val + (Math.random() * range - range / 2);
        const points = [];
        const steps = 10;
        for (let i = 0; i <= steps; i++) {
            const x = (100 / steps) * i;
            points.push(`${rough(x, 5)}% ${rough(2, 4)}%`);
        }
        for (let i = 0; i <= steps; i++) {
            const y = (100 / steps) * i;
            points.push(`${rough(98, 4)}% ${rough(y, 5)}%`);
        }
        points.push('95% 100%', '85% 98%', '72% 100%', '60% 97%', '45% 100%', '33% 98%', '20% 100%', '8% 99%');
        for (let i = steps; i >= 0; i--) {
            const y = (100 / steps) * i;
            points.push(`${rough(2, 4)}% ${rough(y, 5)}%`);
        }
        return `polygon(${points.join(', ')})`;
    };
    const handleMouseEnter = () => {
        if (cardRef.current && clipperRef.current) {
            cardRef.current.classList.add('is-hovered');
            const newClipPath = generateWornClipPath();
            clipperRef.current.style.clipPath = newClipPath;
        }
        setIsHovered(true);
    };
    const handleMouseLeave = () => {
        if (cardRef.current && clipperRef.current) {
            cardRef.current.classList.remove('is-hovered');
            clipperRef.current.style.clipPath = '';
        }
        setIsHovered(false);
    };
    return (
        <div
            ref={cardRef}
            className="album-card-mini"
            onClick={() => onSelect(album)}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className="card-clipper" ref={clipperRef}>
                {album.thumb && (
                    <img
                        src={`/api/image?url=${encodeURIComponent(album.thumb)}`}
                        onError={(e: any) => e.target.style.display = 'none'}
                        alt=""
                    />
                )}
                <AutoScrollLabel
                    text={album.title}
                    className="marquee-label"
                    forceHover={isHovered}
                    style={{ fontSize: '0.9rem', fontFamily: 'Mate SC', fontWeight: 600 }}
                />
            </div>
        </div>
    );
};
