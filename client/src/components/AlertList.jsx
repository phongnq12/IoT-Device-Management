import React from 'react';
import { formatTime } from '../utils';

function AlertItem({ alert, onResolve, onDismiss }) {
    const isInactive = alert.resolved || alert.dismissed;
    const stateClass = alert.resolved ? 'resolved' : alert.dismissed ? 'dismissed' : '';
    const statusClass = alert.resolved ? 'alert-status-resolved' : 'alert-status-dismissed';

    return (
        <div className={`alert-item ${stateClass}`} data-alert-id={alert.id}>
            <div className="alert-dot" />
            <div className="alert-content">
                <div className="alert-device">⚠ {alert.serialNumber || alert.deviceId}</div>
                <div className="alert-message">{alert.message}</div>
                <div className="alert-time">{formatTime(alert.timestamp)}</div>
            </div>
            {isInactive ? (
                <div className={`alert-actions alert-status-label ${statusClass}`}>
                    {alert.resolved ? '✓ Resolved' : '∅ Dismissed'}
                </div>
            ) : (
                <div className="alert-actions">
                    <button className="btn-resolve" onClick={() => onResolve(alert.id)}>Resolve</button>
                    <button className="btn-dismiss" onClick={() => onDismiss(alert.id)}>Dismiss</button>
                </div>
            )}
        </div>
    );
}

export default function AlertList({ alerts, onResolve, onDismiss }) {
    const activeCount = alerts.filter(a => !a.resolved && !a.dismissed).length;
    const hasActive = activeCount > 0;

    return (
        <div className="panel alert-panel">
            <div className="panel-header">
                <h2 className="panel-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="panel-icon">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    Alert History
                </h2>
                <span className={`alert-count ${hasActive ? 'alert-count-active' : ''}`} id="alertCountBadge">
                    {activeCount} alert{activeCount !== 1 ? 's' : ''}
                </span>
            </div>
            <div className="alert-list" id="alertList">
                {alerts.length === 0 ? (
                    <div className="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="empty-icon">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                        <p>No alerts</p>
                        <span>Fall detection alerts will appear here</span>
                    </div>
                ) : (
                    alerts.map(alert => (
                        <AlertItem
                            key={alert.id}
                            alert={alert}
                            onResolve={onResolve}
                            onDismiss={onDismiss}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
