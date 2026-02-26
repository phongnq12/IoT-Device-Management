import React from 'react';
import { timeAgo, getDeviceStateClass, getWifiSignalClass, capitalize, getFallStageLabel } from '../utils';

function DeviceRow({ device, onUnpair }) {
    const stateText = device.deviceState || device.status || 'unknown';
    const stateClass = getDeviceStateClass(stateText);

    return (
        <tr data-device-id={device.id}>
            <td>
                <div className="device-id-cell">
                    <span className="device-serial">{device.serialNumber || device.id}</span>
                    {device.serialNumber && (
                        <span className="device-id-sub">{device.id}</span>
                    )}
                    {device.model && (
                        <span className="device-model">{device.model}</span>
                    )}
                </div>
            </td>
            <td>
                <span className={`badge badge-state-${stateClass}`}>
                    <span className="badge-dot" />
                    {capitalize(stateText)}
                </span>
            </td>
            <td>
                {device.personDetected ? (
                    <span className="badge badge-person-yes">👤 Occupied</span>
                ) : (
                    <span className="badge badge-person-no">— Vacant</span>
                )}
            </td>
            <td>
                {device.fallAlert && device.fallStage ? (
                    <span className="badge badge-alert">
                        <span className="badge-dot" />
                        {getFallStageLabel(device.fallStage)}
                    </span>
                ) : (
                    <span className="badge badge-normal">✓ Normal</span>
                )}
            </td>
            <td>
                {device.temperature != null ? (
                    <span className="device-temp">{device.temperature.toFixed(1)}°F</span>
                ) : (
                    <span className="device-temp dim">—</span>
                )}
            </td>
            <td>
                {device.wifiRSSI != null ? (
                    <span
                        className={`wifi-signal ${getWifiSignalClass(device.wifiRSSI)}`}
                        title={`${device.wifiSSID || ''} (${device.wifiRSSI}dBm)`}
                    >
                        📶 {device.wifiRSSI}dBm
                    </span>
                ) : (
                    <span className="wifi-signal dim">—</span>
                )}
            </td>
            <td>
                <span className="last-seen">
                    {device.lastSeen ? timeAgo(device.lastSeen) : '—'}
                </span>
            </td>
            <td>
                <button
                    className="btn-danger-sm btn-unpair"
                    onClick={() => onUnpair(device.id, device.serialNumber || device.id)}
                >
                    Unpair
                </button>
            </td>
        </tr>
    );
}

export default function DeviceTable({ devices, onUnpair }) {
    return (
        <div className="panel device-panel">
            <div className="panel-header">
                <h2 className="panel-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="panel-icon">
                        <rect x="2" y="3" width="20" height="14" rx="2" />
                        <line x1="8" y1="21" x2="16" y2="21" />
                        <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                    Paired Devices
                </h2>
                <span className="device-count" id="deviceCountBadge">
                    {devices.length} device{devices.length !== 1 ? 's' : ''}
                </span>
            </div>
            <div className="table-wrapper" id="deviceTableWrapper">
                <table className="device-table">
                    <thead>
                        <tr>
                            <th>Serial / Device</th>
                            <th>State</th>
                            <th>Presence</th>
                            <th>Fall Alert</th>
                            <th>Temp</th>
                            <th>WiFi</th>
                            <th>Last Seen</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {devices.length === 0 ? (
                            <tr className="empty-row">
                                <td colSpan="8">
                                    <div className="empty-state">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="empty-icon">
                                            <rect x="2" y="3" width="20" height="14" rx="2" />
                                            <line x1="8" y1="21" x2="16" y2="21" />
                                            <line x1="12" y1="17" x2="12" y2="21" />
                                        </svg>
                                        <p>No devices paired</p>
                                        <span>Click "Pair Device" to add your first IoT device</span>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            devices.map(device => (
                                <DeviceRow
                                    key={device.id}
                                    device={device}
                                    onUnpair={onUnpair}
                                />
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
