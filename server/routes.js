const { devices, alertHistory, blockedDevices, deviceIdToSerial, getDeviceOrCreate, getAllDevicesArray } = require('./store');
const { broadcastToClients } = require('./ws-handler');
const { getBrokerStatus, getAedesInstance } = require('./broker');
const { createAlert } = require('./mqtt-handler');
const { getLocalIP } = require('./utils');
const {
    PORT_MIN, PORT_MAX,
    DEMO_DEVICES, DEMO_STATES, DEMO_FALL_STAGES,
    DEMO_TEMP_BASE, DEMO_TEMP_RANGE,
    DEMO_WIFI_BASE, DEMO_WIFI_RANGE,
    DEMO_MEMORY_BASE, DEMO_MEMORY_RANGE,
    DEMO_PERSON_PROBABILITY, DEMO_FIRMWARE_VERSION,
} = require('./config');

// Async route wrapper — catches unhandled promise rejections
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

function registerRoutes(app) {

    // ─── Devices ───────────────────────────────────────────────
    app.get('/api/devices', (req, res) => {
        res.json({ devices: getAllDevicesArray() });
    });

    app.get('/api/devices/:id', (req, res) => {
        const device = devices.get(req.params.id);
        if (!device) return res.status(404).json({ error: 'Device not found' });
        res.json({ device });
    });

    app.delete('/api/devices/:id', (req, res) => {
        const deviceId = req.params.id;
        if (!devices.has(deviceId)) {
            return res.status(404).json({ error: 'Device not found' });
        }

        blockedDevices.add(deviceId);
        devices.delete(deviceId);
        deviceIdToSerial.delete(deviceId);

        const aedes = getAedesInstance();
        for (const client of Object.values(aedes.clients || {})) {
            if (client && client.id === deviceId) {
                client.close();
                console.log(`[MQTT Broker] Force-disconnected: ${deviceId}`);
                break;
            }
        }

        broadcastToClients('device_removed', { id: deviceId });
        res.json({ success: true, message: `Device ${deviceId} unpaired` });
    });

    // ─── Broker ────────────────────────────────────────────────
    app.get('/api/broker/info', (req, res) => {
        res.json(getBrokerStatus());
    });

    app.post('/api/broker/config', asyncHandler(async (req, res) => {
        const { port } = req.body;
        const portNumber = parseInt(port, 10);

        if (!port || isNaN(portNumber) || portNumber < PORT_MIN || portNumber > PORT_MAX) {
            return res.status(400).json({ error: `Port must be between ${PORT_MIN} and ${PORT_MAX}` });
        }

        const { startBroker } = require('./broker');
        await startBroker(portNumber);
        res.json({ success: true, broker: getBrokerStatus() });
    }));


    // ─── Alerts ────────────────────────────────────────────────
    app.get('/api/alerts', (req, res) => {
        res.json({ alerts: alertHistory });
    });

    app.post('/api/alerts/:id/resolve', (req, res) => {
        const alert = alertHistory.find((a) => a.id === req.params.id);
        if (!alert) return res.status(404).json({ error: 'Alert not found' });
        alert.resolved = true;

        const device = devices.get(alert.deviceId);
        if (device && device.fallAlert) {
            device.fallAlert = false;
            device.fallStage = null;
            broadcastToClients('device_update', device);
        }

        broadcastToClients('alert_resolved', alert);
        res.json({ success: true, alert });
    });

    app.post('/api/alerts/:id/dismiss', (req, res) => {
        const alert = alertHistory.find((a) => a.id === req.params.id);
        if (!alert) return res.status(404).json({ error: 'Alert not found' });
        alert.dismissed = true;

        const device = devices.get(alert.deviceId);
        if (device && device.fallAlert) {
            device.fallAlert = false;
            device.fallStage = null;
            broadcastToClients('device_update', device);
        }

        broadcastToClients('alert_dismissed', alert);
        res.json({ success: true, alert });
    });

    // ─── Simulate (Demo) ──────────────────────────────────────
    app.post('/api/simulate', (req, res) => {
        const now = new Date().toISOString();

        DEMO_DEVICES.forEach((demo, i) => {
            blockedDevices.delete(demo.id);
            deviceIdToSerial.set(demo.id, demo.serial);

            const device = getDeviceOrCreate(demo.id);
            device.serialNumber = demo.serial;
            device.status = 'online';
            device.deviceState = DEMO_STATES[i];
            device.model = demo.model;
            device.temperature = DEMO_TEMP_BASE + Math.round(Math.random() * DEMO_TEMP_RANGE * 10) / 10;
            device.wifiRSSI = DEMO_WIFI_BASE - Math.floor(Math.random() * DEMO_WIFI_RANGE);
            device.wifiSSID = demo.ssid;
            device.memoryUsage = DEMO_MEMORY_BASE + Math.floor(Math.random() * DEMO_MEMORY_RANGE);
            device.firmwareVersion = DEMO_FIRMWARE_VERSION;
            device.lastSeen = now;

            device.personDetected = Math.random() > DEMO_PERSON_PROBABILITY;
            if (device.personDetected) {
                device.presenceDetails = [{
                    id: 0, posture: Math.floor(Math.random() * 3),
                    xPosCm: Math.round(Math.random() * 200 - 100),
                    yPosCm: Math.round(Math.random() * 200),
                    zPosCm: Math.round(Math.random() * 180),
                }];
                device.lastPersonEvent = now;
            }

            device.fallStage = DEMO_FALL_STAGES[i];
            device.fallAlert = !!DEMO_FALL_STAGES[i];
            if (device.fallAlert) {
                device.lastFallEvent = now;
                const displayName = device.serialNumber || demo.id;
                createAlert({
                    deviceId: demo.id,
                    serialNumber: demo.serial,
                    type: 'fall',
                    stage: device.fallStage,
                    message: `Fall Detected on ${displayName} (${demo.room})`,
                });
            }

            broadcastToClients('device_update', device);
        });

        broadcastToClients('broker_status', getBrokerStatus());
        res.json({ success: true, message: 'Vayyar Care demo data generated', devices: getAllDevicesArray() });
    });

    // ─── Error Handler ─────────────────────────────────────────
    app.use((err, req, res, _next) => {
        console.error(`[Server Error] ${req.method} ${req.path}:`, err.message);
        res.status(500).json({ error: 'Internal server error' });
    });
}

module.exports = { registerRoutes };
