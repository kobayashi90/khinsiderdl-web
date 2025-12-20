import React from 'react';

export const AlbumArtStack = ({ images, onClick }: { images: string[]; onClick: () => void }) => {
    if (!images || images.length === 0) return null;
    if (images.length === 1) {
        return (
            <div className="album-cover-frame" onClick={onClick}>
                <img src={`/api/image?url=${encodeURIComponent(images[0])}`} className="album-cover" />
            </div>
        );
    }
    return (
        <div className="stack-container" onClick={onClick} title="Click to view all covers">
            {images.slice(0, 3).reverse().map((img, i) => {
                return (
                    <img
                        key={i}
                        src={`/api/image?url=${encodeURIComponent(img)}`}
                        className={`stack-item stack-pos-${i}`}
                        alt={`Cover art ${i + 1}`}
                    />
                );
            })}
            <div className="stack-badge">{images.length}</div>
        </div>
    );
};
