import React, { useState, useCallback } from 'react';
import { copyToClipboard } from '../utils';

export default function CopyButton({ text }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(() => {
        if (!text) return;
        copyToClipboard(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        });
    }, [text]);

    return (
        <button
            className={`btn-copy ${copied ? 'copied' : ''}`}
            onClick={handleCopy}
            title="Copy"
        >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
        </button>
    );
}
