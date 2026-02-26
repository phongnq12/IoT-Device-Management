const MAX_ALERTS = 200;
const HTTP_PORT = process.env.PORT || 3000;
const INITIAL_MQTT_PORT = process.env.MQTT_PORT || 1883;

// Network
const PORT_MIN = 1;
const PORT_MAX = 65535;

// Simulation
const DEMO_TEMP_BASE = 70;
const DEMO_TEMP_RANGE = 20;
const DEMO_WIFI_BASE = -30;
const DEMO_WIFI_RANGE = 40;
const DEMO_MEMORY_BASE = 30;
const DEMO_MEMORY_RANGE = 40;
const DEMO_PERSON_PROBABILITY = 0.3;
const DEMO_FIRMWARE_VERSION = 'v0.38.42';

const DEMO_DEVICES = [
    { id: 'id_MzA6QUU6QTQ6RTM6RkY6MDg', serial: 'VXTBB2151S03722', model: 'VH3BBGL02', ssid: 'HomeWiFi', room: 'Bedroom' },
    { id: 'id_MDg6M0E6RjI6Mjk6MzA6N0M', serial: 'VXTBB2151S04118', model: 'VH3BBGL02', ssid: 'HomeWiFi', room: 'Bathroom' },
    { id: 'id_RjQ6OTI6QkY6MkQ6N0U6QTE', serial: 'VXTBB3060S01295', model: 'VH3BBGL03', ssid: 'OfficeWiFi', room: 'Living Room' },
    { id: 'id_QTg6MDM6MkE6NjI6QkI6NTQ', serial: 'VXTBB2151S05501', model: 'VH3BBGL02', ssid: 'HomeWiFi', room: 'Hallway' },
    { id: 'id_MkQ6RTU6OEE6MUM6RDQ6QjY', serial: 'VXTBB3060S02843', model: 'VH3BBGL03', ssid: 'HomeWiFi', room: 'Kitchen' },
];

const DEMO_STATES = ['monitoring', 'monitoring', 'monitoring', 'learning', 'monitoring'];
const DEMO_FALL_STAGES = [null, null, 'calling', null, null];

module.exports = {
    MAX_ALERTS,
    HTTP_PORT,
    INITIAL_MQTT_PORT,
    PORT_MIN,
    PORT_MAX,
    DEMO_DEVICES,
    DEMO_STATES,
    DEMO_FALL_STAGES,
    DEMO_TEMP_BASE,
    DEMO_TEMP_RANGE,
    DEMO_WIFI_BASE,
    DEMO_WIFI_RANGE,
    DEMO_MEMORY_BASE,
    DEMO_MEMORY_RANGE,
    DEMO_PERSON_PROBABILITY,
    DEMO_FIRMWARE_VERSION,
};
