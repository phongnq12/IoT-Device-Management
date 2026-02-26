import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const {
    MAX_ALERTS, HTTP_PORT, INITIAL_MQTT_PORT,
    PORT_MIN, PORT_MAX,
    DEMO_DEVICES, DEMO_STATES, DEMO_FALL_STAGES,
    DEMO_TEMP_BASE, DEMO_TEMP_RANGE,
    DEMO_WIFI_BASE, DEMO_WIFI_RANGE,
    DEMO_MEMORY_BASE, DEMO_MEMORY_RANGE,
    DEMO_PERSON_PROBABILITY, DEMO_FIRMWARE_VERSION,
} = require('../config');

describe('config', () => {
    it('exports MAX_ALERTS as a positive number', () => {
        expect(MAX_ALERTS).toBeTypeOf('number');
        expect(MAX_ALERTS).toBeGreaterThan(0);
    });

    it('exports valid port defaults', () => {
        expect(HTTP_PORT).toBeTruthy();
        expect(INITIAL_MQTT_PORT).toBeTruthy();
    });

    it('exports port range constants', () => {
        expect(PORT_MIN).toBe(1);
        expect(PORT_MAX).toBe(65535);
    });

    it('exports DEMO_DEVICES with 5 entries and required fields', () => {
        expect(DEMO_DEVICES).toHaveLength(5);
        DEMO_DEVICES.forEach(device => {
            expect(device).toHaveProperty('id');
            expect(device).toHaveProperty('serial');
            expect(device).toHaveProperty('model');
            expect(device).toHaveProperty('ssid');
            expect(device).toHaveProperty('room');
        });
    });

    it('exports DEMO_STATES and DEMO_FALL_STAGES matching device count', () => {
        expect(DEMO_STATES).toHaveLength(DEMO_DEVICES.length);
        expect(DEMO_FALL_STAGES).toHaveLength(DEMO_DEVICES.length);
    });

    it('exports simulation constants with correct types', () => {
        expect(DEMO_TEMP_BASE).toBeTypeOf('number');
        expect(DEMO_TEMP_RANGE).toBeTypeOf('number');
        expect(DEMO_WIFI_BASE).toBeTypeOf('number');
        expect(DEMO_WIFI_RANGE).toBeTypeOf('number');
        expect(DEMO_MEMORY_BASE).toBeTypeOf('number');
        expect(DEMO_MEMORY_RANGE).toBeTypeOf('number');
        expect(DEMO_PERSON_PROBABILITY).toBeTypeOf('number');
        expect(DEMO_PERSON_PROBABILITY).toBeGreaterThanOrEqual(0);
        expect(DEMO_PERSON_PROBABILITY).toBeLessThanOrEqual(1);
        expect(DEMO_FIRMWARE_VERSION).toBeTypeOf('string');
    });
});
