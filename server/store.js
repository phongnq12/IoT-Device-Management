const devices = new Map();
const alertHistory = [];
const blockedDevices = new Set();
const deviceIdToSerial = new Map();

function getDeviceOrCreate(deviceId) {
    if (!devices.has(deviceId)) {
        devices.set(deviceId, {
            id: deviceId,
            serialNumber: deviceIdToSerial.get(deviceId) || null,
            status: 'offline',
            deviceState: null,
            personDetected: false,
            presenceDetails: null,
            fallAlert: false,
            fallStage: null,
            fallSuspected: false,
            temperature: null,
            wifiRSSI: null,
            wifiSSID: null,
            memoryUsage: null,
            model: null,
            firmwareVersion: null,
            lastSeen: null,
            lastPersonEvent: null,
            lastFallEvent: null,
            pairedAt: new Date().toISOString(),
        });
    }
    return devices.get(deviceId);
}

function getAllDevicesArray() {
    return Array.from(devices.values());
}

module.exports = {
    devices,
    alertHistory,
    blockedDevices,
    deviceIdToSerial,
    getDeviceOrCreate,
    getAllDevicesArray
};
