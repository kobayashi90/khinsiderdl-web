import React, { useState } from 'react';
import { AutoScrollLabel } from './AutoScrollLabel';

export const SearchResultItem = ({ item, isSelected, onSelect, toTitleCase }: any) => {
    const [isHovered, setIsHovered] = useState(false);
    return (
        <div
            onClick={() => onSelect(item)}
            className={`index-item ${isSelected ? 'active' : ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {item.icon && (
                <img
                    src={`/api/image?url=${encodeURIComponent(item.icon)}`}
                    className="thumb"
                    onError={(e: any) => e.target.style.display = 'none'}
                    alt=""
                />
            )}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <AutoScrollLabel
                    text={toTitleCase(item.title) || "Unknown Title"}
                    className="f-body"
                    forceHover={isHovered}
                    style={{
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        lineHeight: '1.2',
                        color: '#e2d6b5',
                    }}
                />
            </div>
        </div>
    );
};
