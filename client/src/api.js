const API_BASE = '/api';

async function fetchJSON(url, options = {}) {
    const res = await fetch(`${API_BASE}${url}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || res.statusText);
    }
    return res.json();
}

export function getDevices() {
    return fetchJSON('/devices');
}

export function getDevice(id) {
    return fetchJSON(`/devices/${id}`);
}

export function unpairDevice(id) {
    return fetchJSON(`/devices/${id}`, { method: 'DELETE' });
}

export function getBrokerInfo() {
    return fetchJSON('/broker/info');
}

export function resolveAlert(id) {
    return fetchJSON(`/alerts/${id}/resolve`, { method: 'POST' });
}

export function dismissAlert(id) {
    return fetchJSON(`/alerts/${id}/dismiss`, { method: 'POST' });
}

export function simulateData() {
    return fetchJSON('/simulate', { method: 'POST' });
}
