import React from 'react';
import { MedievalSpinner } from './MedievalSpinner';

export const LoadingIndicator = () => (
    <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        color: 'var(--c-gold-dim)'
    }}>
        <style jsx>{`.progress-bar {  width: 10rem; height: 0.25rem;  background-color: var(--c-gold-dim);  margin: 1.5rem 0 0.75rem 0;  border-radius: 2px;  overflow: hidden;  position: relative;  box-shadow: 0 0 5px rgba(197, 160, 89, 0.2); } .progress-bar::after {  content: '';  position: absolute; top: 0; left: 0; height: 100%; width: 100%;  background-image: linear-gradient( -75deg, transparent 0%, transparent 40%, var(--c-gold) 50%, transparent 60%, transparent 100% );  background-size: 200% 100%;  animation: progress-shine 1.5s linear infinite;  } .loading-text {  font-family: 'Mate SC', serif;  font-size: 1rem;  letter-spacing: 0.1em;  text-transform: uppercase;  color: var(--c-gold-dim);  text-shadow: 0 0 5px rgba(197, 160, 89, 0.3); } @keyframes progress-shine { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
        <MedievalSpinner className="spinner-svg large" />
        <div className="progress-bar"></div>
        <div className="loading-text">Loading</div>
    </div>
);
