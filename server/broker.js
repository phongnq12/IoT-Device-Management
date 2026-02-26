const net = require('net');
const Aedes = require('aedes');
const { INITIAL_MQTT_PORT } = require('./config');
const { getLocalIP } = require('./utils');
const { devices, blockedDevices, getDeviceOrCreate } = require('./store');
const { broadcastToClients } = require('./ws-handler');

const aedes = Aedes();
const mqttServer = net.createServer(aedes.handle);

let brokerConfig = { port: INITIAL_MQTT_PORT, running: false, connectedClients: 0 };

function getBrokerStatus() {
    const onlineCount = Array.from(devices.values()).filter(d => d.status === 'online').length;
    return {
        ip: getLocalIP(),
        port: brokerConfig.port,
        running: brokerConfig.running,
        connectedClients: onlineCount,
    };
}

function setupBrokerEvents(handleMQTTMessage) {
    aedes.on('client', (client) => {
        console.log(`[MQTT Broker] Client connected: ${client.id}`);
        brokerConfig.connectedClients++;

        if (blockedDevices.has(client.id)) {
            console.log(`[MQTT Broker] Blocked device reconnected: ${client.id} — closing`);
            client.close();
            return;
        }

        const device = getDeviceOrCreate(client.id);
        device.status = 'online';
        device.lastSeen = new Date().toISOString();

        broadcastToClients('device_update', device);
        broadcastToClients('broker_status', getBrokerStatus());
    });

    aedes.on('clientDisconnect', (client) => {
        console.log(`[MQTT Broker] Client disconnected: ${client.id}`);
        brokerConfig.connectedClients = Math.max(0, brokerConfig.connectedClients - 1);

        const device = devices.get(client.id);
        if (device) {
            device.status = 'offline';
            device.lastSeen = new Date().toISOString();
            broadcastToClients('device_update', device);
        }
        broadcastToClients('broker_status', getBrokerStatus());
    });

    aedes.on('publish', (packet, client) => {
        if (!client || packet.topic.startsWith('$SYS')) return;
        if (blockedDevices.has(client.id)) return;

        try {
            const payload = JSON.parse(packet.payload.toString());
            handleMQTTMessage(packet.topic, payload, client.id);
        } catch (err) {
            console.error('[MQTT Broker] Parse error:', err.message);
        }
    });

    aedes.on('subscribe', (subscriptions, client) => {
        if (client) {
            console.log(`[MQTT Broker] ${client.id} subscribed to: ${subscriptions.map(s => s.topic).join(', ')}`);
        }
    });
}

function startBroker(port) {
    return new Promise((resolve, reject) => {
        const targetPort = port || brokerConfig.port;

        if (brokerConfig.running) {
            mqttServer.close();
            brokerConfig.running = false;
        }

        mqttServer.listen(targetPort, () => {
            brokerConfig.port = targetPort;
            brokerConfig.running = true;
            console.log(`[MQTT Broker] Running on port ${targetPort}`);
            broadcastToClients('broker_status', getBrokerStatus());
            resolve();
        });

        mqttServer.on('error', (err) => {
            console.error('[MQTT Broker] Error:', err.message);
            reject(err);
        });
    });
}

function getAedesInstance() {
    return aedes;
}

module.exports = { startBroker, getBrokerStatus, setupBrokerEvents, getAedesInstance };
