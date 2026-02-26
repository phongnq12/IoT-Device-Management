import { ref, remove, update, set } from 'firebase/database';
import { db } from './firebase';

export async function getDevices() {
    // Replaced by useFirebaseDatabase listener
    return [];
}

export async function getDevice(id) {
    // Handled by realtime listener
    return null;
}

export async function unpairDevice(id) {
    const deviceRef = ref(db, `devices/${id}`);
    await remove(deviceRef);
}

export async function getBrokerInfo() {
    return { ip: 'Firebase', port: '443', running: true, connectedClients: 1 };
}

export async function resolveAlert(id) {
    const alertRef = ref(db, `alerts/${id}`);
    await update(alertRef, { resolved: true });
}

export async function dismissAlert(id) {
    const alertRef = ref(db, `alerts/${id}`);
    await update(alertRef, { dismissed: true });
}

export async function simulateData() {
    // Generate some mock data on Firebase directly to test UI
    const mockDeviceId = 'dev-sim-' + Math.floor(Math.random() * 1000);
    const mockDeviceRef = ref(db, `devices/${mockDeviceId}`);
    await set(mockDeviceRef, {
        displayName: 'Simulated Sensor',
        state: 'online',
        temperature: 72 + Math.random() * 5,
        wifiSignal: -50,
        lastSeen: Date.now()
    });

    const mockAlertRef = ref(db, `alerts/alert-${Date.now()}`);
    await set(mockAlertRef, {
        deviceId: mockDeviceId,
        message: 'Simulated Fall Detected!',
        resolved: false,
        dismissed: false,
        timestamp: Date.now()
    });
}
