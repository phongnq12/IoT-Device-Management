const { MAX_ALERTS } = require('./config');
const { getDeviceOrCreate, alertHistory, deviceIdToSerial, devices } = require('./store');
const { broadcastToClients } = require('./ws-handler');

// ─── DRY: Shared alert creation ────────────────────────────────
function createAlert({ deviceId, serialNumber, type, stage, message, exitReason }) {
    const alertEntry = {
        id: `alert-${Date.now()}-${deviceId}`,
        deviceId,
        serialNumber: serialNumber || null,
        type,
        stage: stage || null,
        message,
        exitReason: exitReason || null,
        timestamp: new Date().toISOString(),
        resolved: false,
        dismissed: false,
    };
    alertHistory.unshift(alertEntry);
    if (alertHistory.length > MAX_ALERTS) alertHistory.pop();
    broadcastToClients('new_alert', alertEntry);
    return alertEntry;
}

// ─── Event Processors ──────────────────────────────────────────
function handlePresenceEvent(device, eventPayload, deviceId, now) {
    device.personDetected = eventPayload.presenceDetected === true;
    device.lastPersonEvent = now;
    if (eventPayload.trackerTargets) {
        device.presenceDetails = eventPayload.trackerTargets;
    }
    console.log(`[Device ${deviceId}] Presence: ${device.personDetected}`);
}

function handleFallEvent(device, eventPayload, deviceId, now) {
    const fallStatus = eventPayload.status;
    device.lastFallEvent = now;

    const activeFallStages = ['fall_detected', 'fall_confirmed', 'calling'];
    if (activeFallStages.includes(fallStatus)) {
        device.fallStage = fallStatus;
        device.fallAlert = true;
    }

    if (fallStatus === 'fall_exit') {
        device.fallAlert = false;
        device.fallStage = null;
    }

    if (fallStatus === 'calling') {
        const displayName = device.serialNumber || deviceId;
        const location = eventPayload.fallLocX_cm != null
            ? ` at (${eventPayload.fallLocX_cm}, ${eventPayload.fallLocY_cm}, ${eventPayload.fallLocZ_cm})cm`
            : '';
        createAlert({
            deviceId,
            serialNumber: device.serialNumber,
            type: 'fall',
            stage: fallStatus,
            message: `Fall Detected on ${displayName}${location}`,
            exitReason: eventPayload.exitReason,
        });
        console.log(`[ALERT] Fall → Calling on ${displayName}${location}`);
    } else {
        console.log(`[Device ${deviceId}] Fall stage: ${fallStatus}`);
    }
}

function handleTargetOnGround(device, eventPayload, deviceId, now) {
    device.fallSuspected = true;
    device.fallStage = eventPayload.status || 'fall_suspected';
    device.lastFallEvent = now;

    const counter = eventPayload.suspectedEventsCounter || 0;
    const confidence = eventPayload.confidenceLevel || 0;

    if (eventPayload.status === 'calling') {
        device.fallAlert = true;
        const displayName = device.serialNumber || deviceId;
        createAlert({
            deviceId,
            serialNumber: device.serialNumber,
            type: 'target_on_ground',
            stage: 'calling',
            message: `Target on ground → Calling stage on ${displayName} (${counter} suspected events, confidence: ${confidence})`,
        });
        console.log(`[ALERT] Target on Ground → Calling on ${displayName}`);
    } else {
        console.log(`[Device ${deviceId}] Target on ground: suspected #${counter} (confidence: ${confidence})`);
    }
}

// ─── Main MQTT Message Handler ─────────────────────────────────
function handleMQTTMessage(topic, payload, clientId) {
    const cleanTopic = topic.startsWith('/') ? topic.substring(1) : topic;
    const parts = cleanTopic.split('/');

    let deviceId, topicType;

    if (parts.length >= 3 && parts[0] === 'devices') {
        deviceId = parts[1];
        topicType = parts[2];
    } else {
        deviceId = clientId;
        topicType = parts[parts.length - 1];
    }

    const device = getDeviceOrCreate(deviceId);
    const now = new Date().toISOString();
    device.lastSeen = now;

    switch (topicType) {
        case 'state': {
            device.status = 'online';
            device.deviceState = payload.status || null;

            if (payload.serialProduct) {
                deviceIdToSerial.set(deviceId, payload.serialProduct);
                device.serialNumber = payload.serialProduct;
                console.log(`[Mapping] ${deviceId} → Serial: ${payload.serialProduct}`);
            }

            if (payload.temperature != null) device.temperature = payload.temperature;
            if (payload.memoryUsage != null) device.memoryUsage = payload.memoryUsage;
            if (payload.model) device.model = payload.model;
            if (payload.versionName) device.firmwareVersion = payload.versionName;
            if (payload.wifiState) {
                device.wifiRSSI = payload.wifiState.rssi || null;
                device.wifiSSID = payload.wifiState.ssid || null;
            }

            const displayName = device.serialNumber || deviceId;
            console.log(`[Device ${displayName}] State: ${device.deviceState} | Temp: ${device.temperature}°F | WiFi: ${device.wifiRSSI}dBm`);
            break;
        }

        case 'events': {
            const eventPayload = payload.payload || payload;
            const eventType = payload.type || eventPayload.type;

            if (!device.serialNumber && deviceIdToSerial.has(deviceId)) {
                device.serialNumber = deviceIdToSerial.get(deviceId);
            }

            switch (eventType) {
                case 4:
                case 'presence':
                    handlePresenceEvent(device, eventPayload, deviceId, now);
                    break;
                case 5:
                case 'fall':
                    handleFallEvent(device, eventPayload, deviceId, now);
                    break;
                case 8:
                case 'target_on_ground':
                    handleTargetOnGround(device, eventPayload, deviceId, now);
                    break;
                default:
                    console.log(`[Device ${deviceId}] Unknown event type ${eventType}:`, eventPayload);
            }
            break;
        }

        // Legacy topic support
        case 'status':
            device.status = payload.status || 'unknown';
            console.log(`[Device ${deviceId}] Legacy status: ${device.status}`);
            break;

        case 'person':
            device.personDetected = payload.detected === true;
            device.lastPersonEvent = now;
            console.log(`[Device ${deviceId}] Legacy person: ${device.personDetected}`);
            break;

        case 'fall':
            device.fallAlert = payload.alert === true;
            device.lastFallEvent = now;
            if (payload.alert) {
                const displayName = device.serialNumber || deviceId;
                createAlert({
                    deviceId,
                    serialNumber: device.serialNumber,
                    type: 'fall',
                    message: `Fall detected on ${displayName}`,
                });
                console.log(`[ALERT] Legacy fall on ${deviceId}`);
            }
            break;

        default:
            console.log(`[Device ${deviceId}] Message on topic "${topic}":`, payload);
    }

    broadcastToClients('device_update', device);
}

module.exports = { handleMQTTMessage, createAlert };
