import React from 'react';

const CARDS = [
    {
        key: 'total',
        label: 'Total Devices',
        iconClass: 'total',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
        ),
        getValue: (devices) => devices.length,
    },
    {
        key: 'online',
        label: 'Online',
        iconClass: 'online',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
        ),
        getValue: (devices) => devices.filter(d => d.status === 'online').length,
    },
    {
        key: 'person',
        label: 'Occupied',
        iconClass: 'person',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
            </svg>
        ),
        getValue: (devices) => devices.filter(d => d.personDetected).length,
    },
    {
        key: 'fall',
        label: 'Fall Alerts',
        iconClass: 'fall',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
        ),
        getValue: (devices) => devices.filter(d => d.fallAlert).length,
    },
];

export default function SummaryCards({ devices }) {
    return (
        <section className="summary-section" id="summarySection">
            {CARDS.map((card) => (
                <div className="summary-card" key={card.key}>
                    <div className={`card-icon ${card.iconClass}`}>
                        {card.icon}
                    </div>
                    <div className="card-info">
                        <span className="card-value">{card.getValue(devices)}</span>
                        <span className="card-label">{card.label}</span>
                    </div>
                </div>
            ))}
        </section>
    );
}
