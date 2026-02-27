const net = require('net');
const Aedes = require('aedes');
const { getLocalIP } = require('./utils');
const { ref, set } = require('firebase/database');
const { db } = require('./firebase');

const aedes = Aedes();
const mqttServer = net.createServer(aedes.handle);

let brokerConfig = { port: 1883, running: false, connectedClients: 0 };

function updateBrokerStatus() {
    const status = {
        ip: getLocalIP(),
        port: brokerConfig.port,
        running: brokerConfig.running,
        connectedClients: brokerConfig.connectedClients
    };
    set(ref(db, 'broker'), status).catch(err => console.error('[MQTT Broker] Failed to sync status:', err.message));
}

function setupBrokerEvents(handleMQTTMessage) {
    aedes.on('client', (client) => {
        console.log(`[MQTT Broker] Client connected: ${client.id}`);
        brokerConfig.connectedClients++;
        updateBrokerStatus();
    });

    aedes.on('clientDisconnect', (client) => {
        console.log(`[MQTT Broker] Client disconnected: ${client.id}`);
        brokerConfig.connectedClients = Math.max(0, brokerConfig.connectedClients - 1);
        updateBrokerStatus();
    });

    aedes.on('publish', (packet, client) => {
        if (!client || packet.topic.startsWith('$SYS')) return;

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
            updateBrokerStatus();
            resolve();
        });

        mqttServer.on('error', (err) => {
            console.error('[MQTT Broker] Error:', err.message);
            reject(err);
        });
    });
}

module.exports = { startBroker, setupBrokerEvents };
