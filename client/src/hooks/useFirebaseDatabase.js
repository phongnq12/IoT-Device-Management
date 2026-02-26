import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';

export function useFirebaseDatabase() {
    const [devices, setDevices] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [broker, setBroker] = useState({ ip: 'Firebase', port: '443', running: true, connectedClients: 1 });

    useEffect(() => {
        // Listen to devices
        const devicesRef = ref(db, 'devices');
        const unsubDevices = onValue(devicesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                // Firebase stores objects, convert to array
                const devicesArray = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                }));
                setDevices(devicesArray);
            } else {
                setDevices([]);
            }
        });

        // Listen to alerts
        const alertsRef = ref(db, 'alerts');
        const unsubAlerts = onValue(alertsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                // Firebase stores objects, convert to array and sort by timestamp
                const alertsArray = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                })).sort((a, b) => b.timestamp - a.timestamp);
                setAlerts(alertsArray);
            } else {
                setAlerts([]);
            }
        });

        return () => {
            unsubDevices();
            unsubAlerts();
        };
    }, []);

    return { devices, alerts, broker };
}
