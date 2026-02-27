const mqtt = require('mqtt');

const IP = process.argv[2] || 'localhost';
const client = mqtt.connect(`mqtt://${IP}:1883`);

client.on('connect', () => {
    console.log('[Test] Connected to MQTT broker');

    // Simulate device coming online
    const statePayload = {
        status: 'monitoring',
        serialProduct: 'SIM-VAYYAR-001',
        temperature: 72.5,
        memoryUsage: 45,
        model: 'VayyarCare',
        versionName: '1.2.3',
        wifiState: { rssi: -55, ssid: 'Home_Network' }
    };
    client.publish('devices/sim-dev-01/state', JSON.stringify(statePayload));

    // Simulate a fall after 1.5 seconds
    setTimeout(() => {
        const fallPayload = {
            type: 5,
            status: 'calling',
            fallLocX_cm: 150,
            fallLocY_cm: 200,
            fallLocZ_cm: 10
        };
        client.publish('devices/sim-dev-01/events', JSON.stringify(fallPayload));
        console.log('[Test] Published state and fall event.');

        setTimeout(() => client.end(), 500);
    }, 1500);
});
