import React, { useState, useCallback } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { useToast } from './hooks/useToast';
import * as api from './api';

import Navbar from './components/Navbar';
import BrokerBanner from './components/BrokerBanner';
import SummaryCards from './components/SummaryCards';
import DeviceTable from './components/DeviceTable';
import AlertList from './components/AlertList';
import { UnpairModal } from './components/Modals';
import Toast from './components/Toast';

export default function App() {
    // ─── State ─────────────────────────────────────────────────
    const [devices, setDevices] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [broker, setBroker] = useState({ ip: '—', port: '—', running: false, connectedClients: 0 });


    const [unpairTarget, setUnpairTarget] = useState(null); // { id, name }

    const { toast, showToast } = useToast();

    // ─── WebSocket Handler ─────────────────────────────────────
    const handleWSMessage = useCallback((msg) => {
        switch (msg.type) {
            case 'init':
                setDevices(msg.data.devices || []);
                setAlerts(msg.data.alerts || []);
                setBroker(msg.data.broker || {});
                break;

            case 'device_update':
                setDevices(prev => {
                    const idx = prev.findIndex(d => d.id === msg.data.id);
                    if (idx >= 0) {
                        const updated = [...prev];
                        updated[idx] = msg.data;
                        return updated;
                    }
                    return [...prev, msg.data];
                });
                break;

            case 'device_removed':
                setDevices(prev => prev.filter(d => d.id !== msg.data.id));
                break;

            case 'new_alert':
                setAlerts(prev => [msg.data, ...prev]);
                break;

            case 'alert_resolved':
                setAlerts(prev => prev.map(a =>
                    a.id === msg.data.id ? { ...a, resolved: true } : a
                ));
                break;

            case 'alert_dismissed':
                setAlerts(prev => prev.map(a =>
                    a.id === msg.data.id ? { ...a, dismissed: true } : a
                ));
                break;

            case 'broker_status':
                setBroker(prev => ({ ...prev, ...msg.data }));
                break;
        }
    }, []);

    useWebSocket(handleWSMessage);

    // ─── Actions ───────────────────────────────────────────────
    const handleSimulate = useCallback(async () => {
        try {
            await api.simulateData();
        } catch (err) {
            showToast(`Error: ${err.message}`);
        }
    }, [showToast]);

    const handleUnpairClick = useCallback((deviceId, displayName) => {
        setUnpairTarget({ id: deviceId, name: displayName });
    }, []);

    const handleConfirmUnpair = useCallback(async () => {
        if (!unpairTarget) return;
        try {
            await api.unpairDevice(unpairTarget.id);
            showToast(`Device ${unpairTarget.id} unpaired`);
        } catch (err) {
            showToast(`Failed to unpair: ${err.message}`);
        } finally {
            setUnpairTarget(null);
        }
    }, [unpairTarget, showToast]);

    const handleResolveAlert = useCallback(async (alertId) => {
        try {
            await api.resolveAlert(alertId);
        } catch (err) {
            showToast(`Failed to resolve: ${err.message}`);
        }
    }, [showToast]);

    const handleDismissAlert = useCallback(async (alertId) => {
        try {
            await api.dismissAlert(alertId);
        } catch (err) {
            showToast(`Failed to dismiss: ${err.message}`);
        }
    }, [showToast]);

    // ─── Render ────────────────────────────────────────────────
    return (
        <>
            <Navbar
                broker={broker}
                onSimulateClick={handleSimulate}
            />

            <main className="main-content" id="mainContent">
                <BrokerBanner broker={broker} />
                <SummaryCards devices={devices} />

                <section className="content-grid">
                    <DeviceTable
                        devices={devices}
                        onUnpair={handleUnpairClick}
                    />
                    <AlertList
                        alerts={alerts}
                        onResolve={handleResolveAlert}
                        onDismiss={handleDismissAlert}
                    />
                </section>
            </main>



            <UnpairModal
                isOpen={!!unpairTarget}
                onClose={() => setUnpairTarget(null)}
                onConfirm={handleConfirmUnpair}
                deviceName={unpairTarget?.name}
            />

            <Toast message={toast} />
        </>
    );
}
