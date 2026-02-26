import React from 'react';

export default function Navbar({ broker, onSimulateClick }) {
    const isRunning = broker?.running;

    return (
        <nav className="navbar" id="navbar">
            <div className="navbar-left">
                <div className="logo">
                    <svg className="logo-icon" viewBox="0 0 32 32" fill="none">
                        <circle cx="16" cy="16" r="14" stroke="url(#grad)" strokeWidth="2.5" />
                        <circle cx="16" cy="16" r="6" fill="url(#grad)" />
                        <circle cx="16" cy="6" r="2.5" fill="#4dd0e1" />
                        <circle cx="24.7" cy="21" r="2.5" fill="#26c6da" />
                        <circle cx="7.3" cy="21" r="2.5" fill="#00bcd4" />
                        <defs>
                            <linearGradient id="grad" x1="0" y1="0" x2="32" y2="32">
                                <stop stopColor="#4dd0e1" />
                                <stop offset="1" stopColor="#00838f" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <span className="logo-text">IoT Monitor</span>
                </div>
            </div>
            <div className="navbar-right">
                <div className="broker-status" id="brokerStatusBadge">
                    <span className={`status-dot ${isRunning ? 'online' : 'offline'}`} />
                    <span className="status-text">
                        {isRunning ? `Broker Active — Port ${broker.port}` : 'Broker Inactive'}
                    </span>
                </div>
                <button className="btn-icon" onClick={onSimulateClick} title="Generate Demo Data">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                </button>
            </div>
        </nav>
    );
}
