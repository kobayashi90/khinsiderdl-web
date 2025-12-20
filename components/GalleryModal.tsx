import React from 'react';
import { Icon } from './Icon';

export const GalleryModal = ({ images, onClose }: { images: string[]; onClose: () => void }) => {
    return (
        <div className="gallery-overlay" onClick={onClose}>
            <div className="gallery-content" onClick={e => e.stopPropagation()}>
                <div className="gallery-header">
                    <h3 className="f-header" style={{ margin: 0, color: '#c5a059' }}>Gallery</h3>
                    <button className="btn-mini" onClick={onClose}><Icon name="close" /></button>
                </div>
                <div className="gallery-grid">
                    {images.map((img, i) => (
                        <div key={i} className="gallery-item">
                            <img src={`/api/image?url=${encodeURIComponent(img)}`} alt={`Full cover art ${i + 1}`} />
                            <span>Cover {i + 1}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
