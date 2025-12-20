import React, { useState, useEffect } from 'react';
import { dlManager } from '../lib/download-manager';
import { Icon } from './Icon';

export const QueueView = () => {
    const [state, setState] = useState(dlManager.getState());
    useEffect(() => {
        const handler = (newState: any) => setState(newState);
        dlManager.on('update', handler);
        const itemHandler = () => setState(dlManager.getState());
        dlManager.on('itemUpdate', itemHandler);
        return () => {
            dlManager.off('update', handler);
            dlManager.off('itemUpdate', itemHandler);
        };
    }, []);
    const { active, queue, completed, errors } = state;
    const renderItem = (item: any, isActive: boolean) => (
        <div key={item.id} className={`queue-item ${isActive ? 'active' : ''}`}>
            {isActive && <div className="progress-bg" style={{ width: `${item.progress}%` }}></div>}
            <div className="q-info">
                <span className="q-type">{item.type === 'album' ? 'ALBUM' : 'TRACK'}</span>
                <span className="q-title">{item.type === 'album' ? item.meta.name : item.track.title}</span>
                {item.type === 'track' && <span className="q-meta">{item.meta.name}</span>}
                <span className="q-status-text">{item.statusText}</span>
            </div>
            <div className="q-actions">
                {(isActive || item.status === 'pending') && (
                    <button className="btn-icon-only" onClick={() => dlManager.cancel(item.id)}>
                        <Icon name="close" size={14} />
                    </button>
                )}
            </div>
        </div>
    );
    return (
        <div className="queue-container medieval-scroll">
            <div className="queue-header">
                <h2 className="f-header" style={{ margin: 0 }}>Download Queue</h2>
                <button className="btn-mini" onClick={() => dlManager.clearCompleted()} title="Clear Completed">
                    <Icon name="trash" size={16} />
                </button>
            </div>
            <div className="queue-section">
                <h3 className="f-ui queue-section-title">Active ({active.length})</h3>
                {active.length === 0 && <div className="empty-msg">No active downloads</div>}
                {active.map(item => renderItem(item, true))}
            </div>
            <div className="queue-section">
                <h3 className="f-ui queue-section-title">Pending ({queue.length})</h3>
                {queue.length === 0 && <div className="empty-msg">Queue is empty</div>}
                {queue.map(item => renderItem(item, false))}
            </div>
            {(errors.length > 0) && (
                <div className="queue-section">
                    <h3 className="f-ui queue-section-title" style={{ color: '#d44' }}>Errors ({errors.length})</h3>
                    {errors.map((item: any) => (
                        <div key={item.id} className="queue-item error" onClick={() => dlManager.retry(item.id)}>
                            <div className="q-info">
                                <span className="q-title">{item.type === 'album' ? item.meta.name : item.track.title}</span>
                                <span className="q-meta">{item.error || "Failed"}</span>
                            </div>
                            <div className="q-status"><Icon name="refresh" size={14} /></div>
                        </div>
                    ))}
                </div>
            )}
            {(completed.length > 0) && (
                <div className="queue-section">
                    <h3 className="f-ui queue-section-title" style={{ color: '#4a6' }}>Completed ({completed.length})</h3>
                    {completed.map(item => renderItem(item, false))}
                </div>
            )}
        </div>
    );
};
