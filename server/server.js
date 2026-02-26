const express = require('express');
const http = require('http');
const cors = require('cors');

const { HTTP_PORT, INITIAL_MQTT_PORT } = require('./config');
const { getLocalIP } = require('./utils');
const { initWSS } = require('./ws-handler');
const { startBroker, getBrokerStatus, setupBrokerEvents } = require('./broker');
const { handleMQTTMessage } = require('./mqtt-handler');
const { registerRoutes } = require('./routes');

// ─── Express App ───────────────────────────────────────────────
const app = express();
const httpServer = http.createServer(app);

app.use(cors());
app.use(express.json());

// ─── Wire Modules ──────────────────────────────────────────────
initWSS(httpServer, getBrokerStatus);
setupBrokerEvents(handleMQTTMessage);
registerRoutes(app);

// ─── Start ─────────────────────────────────────────────────────
httpServer.listen(HTTP_PORT, async () => {
    try {
        await startBroker(INITIAL_MQTT_PORT);
    } catch (err) {
        console.error('[MQTT Broker] Failed to start:', err.message);
    }

    const ip = getLocalIP();
    console.log(`
╔══════════════════════════════════════════════════════╗
║          IoT Dashboard Server Started                ║
║──────────────────────────────────────────────────────║
║  REST API:      http://${ip}:${HTTP_PORT}                ║
║  WebSocket:     ws://${ip}:${HTTP_PORT}                  ║
║  MQTT Broker:   mqtt://${ip}:${INITIAL_MQTT_PORT}               ║
║──────────────────────────────────────────────────────║
║  Devices can pair using:                             ║
║    MQTT IP:   ${ip}                              ║
║    MQTT Port: ${INITIAL_MQTT_PORT}                                    ║
╚══════════════════════════════════════════════════════════╝
  `);
});
