import { vi } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const { devices, alertHistory, deviceIdToSerial } = require('../store');
const { createAlert, handleMQTTMessage } = require('../mqtt-handler');
const { MAX_ALERTS } = require('../config');

describe('mqtt-handler', () => {
    beforeEach(() => {
        devices.clear();
        alertHistory.length = 0;
        deviceIdToSerial.clear();
    });

    describe('createAlert', () => {
        it('creates alert with correct fields', () => {
            const alert = createAlert({
                deviceId: 'dev-1',
                serialNumber: 'SN-001',
                type: 'fall',
                stage: 'calling',
                message: 'Fall detected',
            });

            expect(alert.id).toMatch(/^alert-/);
            expect(alert.deviceId).toBe('dev-1');
            expect(alert.serialNumber).toBe('SN-001');
            expect(alert.type).toBe('fall');
            expect(alert.stage).toBe('calling');
            expect(alert.message).toBe('Fall detected');
            expect(alert.resolved).toBe(false);
            expect(alert.dismissed).toBe(false);
            expect(alert.timestamp).toBeTypeOf('string');
        });

        it('adds alert to alertHistory at the beginning', () => {
            createAlert({ deviceId: 'a', type: 'fall', message: 'first' });
            createAlert({ deviceId: 'b', type: 'fall', message: 'second' });

            expect(alertHistory).toHaveLength(2);
            expect(alertHistory[0].message).toBe('second');
            expect(alertHistory[1].message).toBe('first');
        });

        it('returns alert object that was added to history', () => {
            const alert = createAlert({ deviceId: 'c', type: 'fall', message: 'test' });

            expect(alertHistory[0]).toBe(alert);
            expect(alert.deviceId).toBe('c');
        });

        it('respects MAX_ALERTS limit', () => {
            for (let i = 0; i < MAX_ALERTS + 10; i++) {
                createAlert({ deviceId: `d${i}`, type: 'fall', message: `alert ${i}` });
            }

            expect(alertHistory).toHaveLength(MAX_ALERTS);
        });

        it('sets optional fields to null when not provided', () => {
            const alert = createAlert({ deviceId: 'e', type: 'fall', message: 'minimal' });

            expect(alert.serialNumber).toBeNull();
            expect(alert.stage).toBeNull();
            expect(alert.exitReason).toBeNull();
        });
    });

    describe('handleMQTTMessage', () => {
        it('processes state topic — sets device online', () => {
            handleMQTTMessage('devices/dev-1/state', {
                status: 'monitoring',
                serialProduct: 'SERIAL-X',
                temperature: 75.5,
                model: 'VH3',
            }, 'dev-1');

            const device = devices.get('dev-1');
            expect(device.status).toBe('online');
            expect(device.deviceState).toBe('monitoring');
            expect(device.serialNumber).toBe('SERIAL-X');
            expect(device.temperature).toBe(75.5);
            expect(device.model).toBe('VH3');
        });

        it('maps serial via deviceIdToSerial on state topic', () => {
            handleMQTTMessage('devices/dev-x/state', {
                serialProduct: 'SN-MAP',
            }, 'dev-x');

            expect(deviceIdToSerial.get('dev-x')).toBe('SN-MAP');
        });

        it('processes wifi state data', () => {
            handleMQTTMessage('devices/dev-w/state', {
                wifiState: { rssi: -45, ssid: 'TestNet' },
            }, 'dev-w');

            const device = devices.get('dev-w');
            expect(device.wifiRSSI).toBe(-45);
            expect(device.wifiSSID).toBe('TestNet');
        });

        it('processes presence event', () => {
            handleMQTTMessage('devices/dev-2/events', {
                type: 'presence',
                payload: { presenceDetected: true },
            }, 'dev-2');

            const device = devices.get('dev-2');
            expect(device.personDetected).toBe(true);
        });

        it('processes fall event with calling status — creates alert', () => {
            handleMQTTMessage('devices/dev-3/events', {
                type: 'fall',
                payload: { status: 'calling' },
            }, 'dev-3');

            const device = devices.get('dev-3');
            expect(device.fallAlert).toBe(true);
            expect(device.fallStage).toBe('calling');
            expect(alertHistory).toHaveLength(1);
            expect(alertHistory[0].type).toBe('fall');
        });

        it('processes fall_exit — clears fall alert', () => {
            handleMQTTMessage('devices/dev-4/events', {
                type: 'fall',
                payload: { status: 'calling' },
            }, 'dev-4');

            handleMQTTMessage('devices/dev-4/events', {
                type: 'fall',
                payload: { status: 'fall_exit' },
            }, 'dev-4');

            const device = devices.get('dev-4');
            expect(device.fallAlert).toBe(false);
            expect(device.fallStage).toBeNull();
        });

        it('processes legacy fall topic', () => {
            handleMQTTMessage('devices/dev-5/fall', { alert: true }, 'dev-5');

            const device = devices.get('dev-5');
            expect(device.fallAlert).toBe(true);
            expect(alertHistory).toHaveLength(1);
        });

        it('updates lastSeen timestamp on any message', () => {
            handleMQTTMessage('devices/dev-7/state', { status: 'online' }, 'dev-7');

            const device = devices.get('dev-7');
            expect(device.lastSeen).toBeTypeOf('string');
            expect(new Date(device.lastSeen).getTime()).not.toBeNaN();
        });
    });
});
