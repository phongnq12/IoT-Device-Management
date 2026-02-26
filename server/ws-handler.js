const { WebSocketServer } = require('ws');
const { getAllDevicesArray, alertHistory } = require('./store');

let wss = null;
let getBrokerStatusCb = null;

function initWSS(httpServer, getBrokerStatus) {
    wss = new WebSocketServer({ server: httpServer });
    getBrokerStatusCb = getBrokerStatus;

    wss.on('connection', (ws) => {
        console.log('[WS] Client connected');

        ws.send(JSON.stringify({
            type: 'init',
            data: {
                devices: getAllDevicesArray(),
                alerts: alertHistory,
                broker: getBrokerStatusCb(),
            },
            timestamp: new Date().toISOString(),
        }));

        ws.on('close', () => {
            console.log('[WS] Client disconnected');
        });
    });
    return wss;
}

function broadcastToClients(type, data) {
    if (!wss) return;
    const message = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

module.exports = { initWSS, broadcastToClients };
