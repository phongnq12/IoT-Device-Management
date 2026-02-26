import React, { useState, useCallback } from 'react';
import { useFirebaseDatabase } from './hooks/useFirebaseDatabase';
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
    const { devices, alerts, broker } = useFirebaseDatabase();
    const [unpairTarget, setUnpairTarget] = useState(null); // { id, name }

    const { toast, showToast } = useToast();

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
