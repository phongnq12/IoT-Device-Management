import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const { devices, alertHistory, blockedDevices, deviceIdToSerial, getDeviceOrCreate, getAllDevicesArray } = require('../store');

describe('store', () => {
    beforeEach(() => {
        devices.clear();
        alertHistory.length = 0;
        blockedDevices.clear();
        deviceIdToSerial.clear();
    });

    describe('getDeviceOrCreate', () => {
        it('creates a new device with correct defaults', () => {
            const device = getDeviceOrCreate('test-001');

            expect(device.id).toBe('test-001');
            expect(device.status).toBe('offline');
            expect(device.personDetected).toBe(false);
            expect(device.fallAlert).toBe(false);
            expect(device.fallStage).toBeNull();
            expect(device.temperature).toBeNull();
            expect(device.pairedAt).toBeTypeOf('string');
        });

        it('returns same device on second call', () => {
            const first = getDeviceOrCreate('test-002');
            first.status = 'online';
            const second = getDeviceOrCreate('test-002');

            expect(second).toBe(first);
            expect(second.status).toBe('online');
        });

        it('uses serial from deviceIdToSerial if available', () => {
            deviceIdToSerial.set('test-003', 'SERIAL123');
            const device = getDeviceOrCreate('test-003');

            expect(device.serialNumber).toBe('SERIAL123');
        });

        it('sets serialNumber to null when no mapping exists', () => {
            const device = getDeviceOrCreate('test-004');
            expect(device.serialNumber).toBeNull();
        });
    });

    describe('getAllDevicesArray', () => {
        it('returns empty array when no devices', () => {
            expect(getAllDevicesArray()).toEqual([]);
        });

        it('returns all devices as array', () => {
            getDeviceOrCreate('d1');
            getDeviceOrCreate('d2');
            getDeviceOrCreate('d3');

            const arr = getAllDevicesArray();
            expect(arr).toHaveLength(3);
            expect(arr.map(d => d.id)).toEqual(['d1', 'd2', 'd3']);
        });
    });

    describe('blockedDevices', () => {
        it('can add and check blocked devices', () => {
            expect(blockedDevices.has('blocked-1')).toBe(false);
            blockedDevices.add('blocked-1');
            expect(blockedDevices.has('blocked-1')).toBe(true);
        });

        it('can remove blocked devices', () => {
            blockedDevices.add('blocked-2');
            blockedDevices.delete('blocked-2');
            expect(blockedDevices.has('blocked-2')).toBe(false);
        });
    });

    describe('alertHistory', () => {
        it('starts empty', () => {
            expect(alertHistory).toHaveLength(0);
        });

        it('can unshift alerts', () => {
            alertHistory.unshift({ id: 'a1', message: 'test' });
            alertHistory.unshift({ id: 'a2', message: 'test2' });

            expect(alertHistory).toHaveLength(2);
            expect(alertHistory[0].id).toBe('a2');
        });
    });
});
