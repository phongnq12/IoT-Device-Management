import React, { useEffect } from 'react';

export function UnpairModal({ isOpen, onClose, onConfirm, deviceName }) {
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className={`modal-overlay ${isOpen ? 'active' : ''}`} onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
        }}>
            <div className="modal modal-unpair">
                <div className="modal-header">
                    <h2 className="modal-title">⚠️ Confirm Unpair</h2>
                </div>
                <div className="modal-body">
                    <p className="modal-description unpair-description">
                        Are you sure you want to unpair the device <strong className="unpair-device-name">{deviceName}</strong>?
                    </p>
                    <div className="alert-box unpair-warning">
                        <strong>Warning:</strong> This device will no longer appear on the system. To reconnect it, you will need to restart the server.
                    </div>
                </div>
                <div className="modal-footer unpair-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn btn-danger" onClick={onConfirm}>Unpair Device</button>
                </div>
            </div>
        </div>
    );
}
