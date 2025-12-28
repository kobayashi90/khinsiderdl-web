import React from 'react';

export const AlbumArtStack = ({ images, onClick, deferLoading }: { images: string[]; onClick: () => void; deferLoading?: boolean }) => {
    const [displayedImages, setDisplayedImages] = React.useState(images);

    React.useEffect(() => {
        if (!deferLoading) {
            setDisplayedImages(images);
        }
    }, [images, deferLoading]);

    if (!displayedImages || displayedImages.length === 0) return null;

    const handleImgError = (e: any, url: string) => {
        if (url && !e.target.src.includes('/api/image')) {
            e.target.src = `/api/image?url=${encodeURIComponent(url)}`;
        }
    };

    if (displayedImages.length === 1) {
        return (
            <div className="album-cover-frame" onClick={onClick}>
                <img
                    src={displayedImages[0]}
                    referrerPolicy="no-referrer"
                    className="album-cover"
                    loading="lazy"
                    // @ts-ignore
                    fetchPriority="low"
                    onError={(e) => handleImgError(e, displayedImages[0])}
                />
            </div>
        );
    }
    return (
        <div className="stack-container" onClick={onClick} title="Click to view all covers">
            {displayedImages.slice(0, 3).reverse().map((img, i) => {
                return (
                    <img
                        key={i}
                        src={img}
                        referrerPolicy="no-referrer"
                        className={`stack-item stack-pos-${i}`}
                        alt={`Cover art ${i + 1}`}
                        loading="lazy"
                        // @ts-ignore
                        fetchPriority="low"
                        onError={(e) => handleImgError(e, img)}
                    />
                );
            })}
            <div className="stack-badge">{displayedImages.length}</div>
        </div>
    );
};