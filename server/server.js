const { INITIAL_MQTT_PORT } = require('./config');
const { getLocalIP } = require('./utils');
const { startBroker, setupBrokerEvents } = require('./broker');
const { handleMQTTMessage } = require('./mqtt-handler');

// ─── Wire Modules ──────────────────────────────────────────────
setupBrokerEvents(handleMQTTMessage);

// ─── Start Hardware Bridge ─────────────────────────────────────
async function boot() {
    try {
        await startBroker(INITIAL_MQTT_PORT);
        const ip = getLocalIP();
        console.log(`
╔══════════════════════════════════════════════════════╗
║      IoT Hardware Bridge (MQTT -> Firebase)          ║
║──────────────────────────────────────────────────────║
║  MQTT Broker:   mqtt://${ip}:${INITIAL_MQTT_PORT}               ║
║──────────────────────────────────────────────────────║
║  Devices can emit MQTT data to the above endpoint.   ║
║  It will be synced instantly to Firebase Realtime DB.║
╚══════════════════════════════════════════════════════╝
        `);
    } catch (err) {
        console.error('[MQTT Broker] Failed to start:', err.message);
    }
}

boot();
