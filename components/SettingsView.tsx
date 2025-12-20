import React from 'react';

export const SettingsView = ({ currentQ, onSetQ }: { currentQ: string; onSetQ: (q: string) => void }) => (
    <div className="settings-panel">
        <h2 className="f-header" style={{ marginBottom: '2rem' }}>Settings</h2>
        <div className="setting-group">
            <h3 className="f-ui" style={{ marginBottom: '1rem' }}>Download Quality</h3>
            {[
                { value: 'best', label: 'Best Available', desc: 'Auto-selects highest quality (FLAC > AAC > MP3)' },
                { value: 'flac', label: 'FLAC Only', desc: 'Strict Mode: Fails if FLAC unavailable' },
                { value: 'mp3', label: 'MP3', desc: 'Compressed, universal compatibility' },
                { value: 'm4a', label: 'M4A/AAC', desc: 'Compressed, Apple-friendly' }
            ].map(opt => (
                <div key={opt.value}
                    onClick={() => onSetQ(opt.value)}
                    className={`setting-option ${currentQ === opt.value ? 'active' : ''}`}
                >
                    <div className="setting-label">{opt.label}</div>
                    <div className="setting-desc">{opt.desc}</div>
                </div>
            ))}
        </div>
    </div>
);
