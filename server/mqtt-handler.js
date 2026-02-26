const { ref, set, update, get, child } = require('firebase/database');
const { db } = require('./firebase');

const deviceIdToSerial = new Map();

async function createAlert({ deviceId, serialNumber, type, stage, message, exitReason }) {
    const alertId = `alert-${Date.now()}-${deviceId}`;
    const alertEntry = {
        deviceId,
        serialNumber: serialNumber || null,
        type,
        stage: stage || null,
        message,
        exitReason: exitReason || null,
        timestamp: Date.now(),
        resolved: false,
        dismissed: false,
    };

    const alertRef = ref(db, `alerts/${alertId}`);
    await set(alertRef, alertEntry);
    return alertEntry;
}

// ─── Event Processors ──────────────────────────────────────────
async function handlePresenceEvent(deviceRef, deviceData, eventPayload, deviceId, now) {
    const updates = {
        personDetected: eventPayload.presenceDetected === true,
        lastPersonEvent: now,
    };
    if (eventPayload.trackerTargets) {
        updates.presenceDetails = eventPayload.trackerTargets;
    }
    await update(deviceRef, updates);
    console.log(`[Device ${deviceId}] Presence: ${updates.personDetected}`);
}

async function handleFallEvent(deviceRef, deviceData, eventPayload, deviceId, now) {
    const fallStatus = eventPayload.status;
    const updates = { lastFallEvent: now };

    const activeFallStages = ['fall_detected', 'fall_confirmed', 'calling'];
    if (activeFallStages.includes(fallStatus)) {
        updates.fallStage = fallStatus;
        updates.fallAlert = true;
    }

    if (fallStatus === 'fall_exit') {
        updates.fallAlert = false;
        updates.fallStage = null;
    }

    await update(deviceRef, updates);

    if (fallStatus === 'calling') {
        const displayName = deviceData.serialNumber || deviceId;
        const location = eventPayload.fallLocX_cm != null
            ? ` at (${eventPayload.fallLocX_cm}, ${eventPayload.fallLocY_cm}, ${eventPayload.fallLocZ_cm})cm`
            : '';
        await createAlert({
            deviceId,
            serialNumber: deviceData.serialNumber,
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

async function handleTargetOnGround(deviceRef, deviceData, eventPayload, deviceId, now) {
    const updates = {
        fallSuspected: true,
        fallStage: eventPayload.status || 'fall_suspected',
        lastFallEvent: now,
    };

    const counter = eventPayload.suspectedEventsCounter || 0;
    const confidence = eventPayload.confidenceLevel || 0;

    if (eventPayload.status === 'calling') {
        updates.fallAlert = true;
        const displayName = deviceData.serialNumber || deviceId;
        await createAlert({
            deviceId,
            serialNumber: deviceData.serialNumber,
            type: 'target_on_ground',
            stage: 'calling',
            message: `Target on ground → Calling stage on ${displayName} (${counter} suspected events, confidence: ${confidence})`,
        });
        console.log(`[ALERT] Target on Ground → Calling on ${displayName}`);
    } else {
        console.log(`[Device ${deviceId}] Target on ground: suspected #${counter} (confidence: ${confidence})`);
    }
    await update(deviceRef, updates);
}

// ─── Main MQTT Message Handler ─────────────────────────────────
async function handleMQTTMessage(topic, payload, clientId) {
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

    const now = Date.now();
    const deviceRef = ref(db, `devices/${deviceId}`);

    // Get existing device data to conditionally update and read serialNumber
    const snapshot = await get(deviceRef);
    let deviceData = snapshot.exists() ? snapshot.val() : {};

    // Always update lastSeen
    await update(deviceRef, { lastSeen: now });

    switch (topicType) {
        case 'state': {
            const updates = {
                status: 'online',
                deviceState: payload.status || null,
            };

            if (payload.serialProduct) {
                deviceIdToSerial.set(deviceId, payload.serialProduct);
                updates.serialNumber = payload.serialProduct;
                deviceData.serialNumber = payload.serialProduct;
                console.log(`[Mapping] ${deviceId} → Serial: ${payload.serialProduct}`);
            }

            if (payload.temperature != null) updates.temperature = payload.temperature;
            if (payload.memoryUsage != null) updates.memoryUsage = payload.memoryUsage;
            if (payload.model) updates.model = payload.model;
            if (payload.versionName) updates.firmwareVersion = payload.versionName;
            if (payload.wifiState) {
                updates.wifiRSSI = payload.wifiState.rssi || null;
                updates.wifiSSID = payload.wifiState.ssid || null;
            }

            await update(deviceRef, updates);
            const displayName = updates.serialNumber || deviceId;
            console.log(`[Device ${displayName}] State: ${updates.deviceState} | Temp: ${updates.temperature}°F | WiFi: ${updates.wifiRSSI}dBm`);
            break;
        }

        case 'events': {
            const eventPayload = payload.payload || payload;
            const eventType = payload.type || eventPayload.type;

            if (!deviceData.serialNumber && deviceIdToSerial.has(deviceId)) {
                deviceData.serialNumber = deviceIdToSerial.get(deviceId);
                await update(deviceRef, { serialNumber: deviceData.serialNumber });
            }

            switch (eventType) {
                case 4:
                case 'presence':
                    await handlePresenceEvent(deviceRef, deviceData, eventPayload, deviceId, now);
                    break;
                case 5:
                case 'fall':
                    await handleFallEvent(deviceRef, deviceData, eventPayload, deviceId, now);
                    break;
                case 8:
                case 'target_on_ground':
                    await handleTargetOnGround(deviceRef, deviceData, eventPayload, deviceId, now);
                    break;
                default:
                    console.log(`[Device ${deviceId}] Unknown event type ${eventType}:`, eventPayload);
            }
            break;
        }

        // Legacy topic support
        case 'status':
            await update(deviceRef, { status: payload.status || 'unknown' });
            console.log(`[Device ${deviceId}] Legacy status: ${payload.status}`);
            break;

        case 'person':
            const personDetected = payload.detected === true;
            await update(deviceRef, {
                personDetected,
                lastPersonEvent: now
            });
            console.log(`[Device ${deviceId}] Legacy person: ${personDetected}`);
            break;

        case 'fall':
            const fallAlert = payload.alert === true;
            await update(deviceRef, {
                fallAlert,
                lastFallEvent: now
            });
            if (fallAlert) {
                const displayName = deviceData.serialNumber || deviceId;
                await createAlert({
                    deviceId,
                    serialNumber: deviceData.serialNumber,
                    type: 'fall',
                    message: `Fall detected on ${displayName}`,
                });
                console.log(`[ALERT] Legacy fall on ${deviceId}`);
            }
            break;

        default:
            console.log(`[Device ${deviceId}] Non-standard message on topic "${topic}"`);
    }
}

module.exports = { handleMQTTMessage, createAlert };
