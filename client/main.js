/* ═══════════════════════════════════════════════════════════════
   IoT Monitor — Main Application Logic
   ═══════════════════════════════════════════════════════════════ */

// ─── State ─────────────────────────────────────────────────────
const state = {
    devices: new Map(),
    alerts: [],
    broker: { ip: '—', port: 1883, running: false, connectedClients: 0 },
    ws: null,
    reconnectTimer: null,
    deviceToUnpair: null, // Stores deviceId pending unpair confirmation
};

// ─── DOM Elements ──────────────────────────────────────────────
const dom = {
    // Summary
    totalDevices: document.getElementById('totalDevices'),
    onlineDevices: document.getElementById('onlineDevices'),
    personDetected: document.getElementById('personDetected'),
    fallAlerts: document.getElementById('fallAlerts'),

    // Device table
    deviceTableBody: document.getElementById('deviceTableBody'),
    deviceCountBadge: document.getElementById('deviceCountBadge'),

    // Alerts
    alertList: document.getElementById('alertList'),
    alertCountBadge: document.getElementById('alertCountBadge'),

    // Broker status (navbar)
    brokerDot: document.getElementById('brokerDot'),
    brokerStatusText: document.getElementById('brokerStatusText'),
    brokerStatusBadge: document.getElementById('brokerStatusBadge'),

    // Broker banner
    brokerIP: document.getElementById('brokerIP'),
    brokerPort: document.getElementById('brokerPort'),
    brokerClients: document.getElementById('brokerClients'),
    brokerRunning: document.getElementById('brokerRunning'),

    // Pair modal
    pairModal: document.getElementById('pairModal'),
    hookIP: document.getElementById('hookIP'),
    hookPort: document.getElementById('hookPort'),

    // Unpair modal
    unpairModal: document.getElementById('unpairModal'),
    unpairDeviceName: document.getElementById('unpairDeviceName'),
    btnConfirmUnpair: document.getElementById('btnConfirmUnpair'),
    btnCancelUnpair: document.getElementById('btnCancelUnpair'),

    // Buttons
    btnPairDevice: document.getElementById('btnPairDevice'),
    btnCloseModal: document.getElementById('btnCloseModal'),
    btnClosePair: document.getElementById('btnClosePair'),
    btnSimulate: document.getElementById('btnSimulate'),
};

// ─── WebSocket Connection ──────────────────────────────────────
function connectWebSocket() {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.hostname}:3000`;

    state.ws = new WebSocket(wsUrl);

    state.ws.onopen = () => {
        console.log('[WS] Connected to server');
        clearTimeout(state.reconnectTimer);
    };

    state.ws.onmessage = (event) => {
        try {
            const msg = JSON.parse(event.data);
            handleWSMessage(msg);
        } catch (err) {
            console.error('[WS] Parse error:', err);
        }
    };

    state.ws.onclose = () => {
        console.log('[WS] Disconnected, retrying in 3s...');
        state.reconnectTimer = setTimeout(connectWebSocket, 3000);
    };

    state.ws.onerror = (err) => {
        console.error('[WS] Error:', err);
    };
}

function handleWSMessage(msg) {
    switch (msg.type) {
        case 'init':
            state.devices.clear();
            (msg.data.devices || []).forEach((d) => state.devices.set(d.id, d));
            state.alerts = msg.data.alerts || [];
            state.broker = msg.data.broker || state.broker;
            renderAll();
            break;

        case 'device_update':
            state.devices.set(msg.data.id, msg.data);
            renderDeviceRow(msg.data);
            updateSummary();
            break;

        case 'device_removed':
            state.devices.delete(msg.data.id);
            renderDeviceTable();
            updateSummary();
            break;

        case 'new_alert':
            state.alerts.unshift(msg.data);
            renderAlertItem(msg.data, true);
            updateAlertCount();
            updateSummary();
            break;

        case 'alert_resolved':
            const idx = state.alerts.findIndex((a) => a.id === msg.data.id);
            if (idx !== -1) state.alerts[idx].resolved = true;
            renderAlerts();
            updateSummary();
            break;

        case 'alert_dismissed':
            const idx2 = state.alerts.findIndex((a) => a.id === msg.data.id);
            if (idx2 !== -1) state.alerts[idx2].dismissed = true;
            renderAlerts();
            updateSummary();
            break;

        case 'broker_status':
            state.broker = { ...state.broker, ...msg.data };
            renderBrokerStatus();
            break;
    }
}

// ─── Render Functions ──────────────────────────────────────────
function renderAll() {
    renderBrokerStatus();
    updateSummary();
    renderDeviceTable();
    renderAlerts();
}

function updateSummary() {
    const devicesArr = Array.from(state.devices.values());
    const total = devicesArr.length;
    const online = devicesArr.filter((d) => d.status === 'online').length;
    const person = devicesArr.filter((d) => d.personDetected).length;
    const fall = devicesArr.filter((d) => d.fallAlert).length;

    animateValue(dom.totalDevices, total);
    animateValue(dom.onlineDevices, online);
    animateValue(dom.personDetected, person);
    animateValue(dom.fallAlerts, fall);

    // Keep the "Connected Devices" banner metric in sync with the table count
    if (dom.brokerClients) {
        animateValue(dom.brokerClients, total);
    }
}

function animateValue(el, newVal) {
    const current = parseInt(el.textContent) || 0;
    if (current === newVal) return;
    el.textContent = newVal;
    el.style.transform = 'scale(1.2)';
    el.style.transition = 'transform 0.3s ease';
    setTimeout(() => { el.style.transform = 'scale(1)'; }, 200);
}

function renderBrokerStatus() {
    const { ip, port, running, connectedClients } = state.broker;

    // Navbar badge
    dom.brokerDot.className = `status-dot ${running ? 'online' : 'offline'}`;
    dom.brokerStatusText.textContent = running
        ? `Broker Active — Port ${port}`
        : 'Broker Inactive';

    // Banner
    dom.brokerIP.textContent = ip;
    dom.brokerPort.textContent = port;
    dom.brokerClients.textContent = connectedClients;
    dom.brokerRunning.textContent = running ? 'Active' : 'Inactive';
    dom.brokerRunning.className = `broker-value ${running ? 'status-active' : ''}`;

    // Pair modal hook info
    dom.hookIP.textContent = ip;
    dom.hookPort.textContent = port;
}

// ─── Device Table ──────────────────────────────────────────────
function renderDeviceTable() {
    const devicesArr = Array.from(state.devices.values());
    dom.deviceCountBadge.textContent = `${devicesArr.length} device${devicesArr.length !== 1 ? 's' : ''}`;

    if (devicesArr.length === 0) {
        dom.deviceTableBody.innerHTML = `
      <tr class="empty-row">
        <td colspan="8">
          <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="empty-icon"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            <p>No devices paired</p>
            <span>Click "Pair Device" to add your first IoT device</span>
          </div>
        </td>
      </tr>`;
        return;
    }

    dom.deviceTableBody.innerHTML = devicesArr.map((d) => createDeviceRowHTML(d)).join('');
    attachUnpairHandlers();
}

function createDeviceRowHTML(device) {
    // Device state badge (Vayyar states: monitoring, learning, initializing, etc.)
    const stateText = device.deviceState || device.status || 'unknown';
    const stateClass = {
        'online': 'online', 'monitoring': 'online', 'learning': 'learning',
        'initializing': 'init', 'rebooting': 'init', 'software update': 'init',
        'offline': 'offline', 'silent': 'silent', 'test': 'test', 'suspend': 'silent',
    }[stateText] || 'offline';
    const stateLabel = stateText.charAt(0).toUpperCase() + stateText.slice(1);
    const stateBadge = `<span class="badge badge-state-${stateClass}"><span class="badge-dot"></span>${stateLabel}</span>`;

    // Presence badge
    const personBadge = device.personDetected
        ? `<span class="badge badge-person-yes">👤 Detected</span>`
        : `<span class="badge badge-person-no">— None</span>`;

    // Fall alert badge with stage info
    let fallBadge;
    if (device.fallAlert && device.fallStage) {
        const stageLabels = {
            'fall_detected': '⚠ Detected', 'fall_confirmed': '🚨 Confirmed',
            'calling': '📞 Calling', 'fall_suspected': '⚠ Suspected',
        };
        const label = stageLabels[device.fallStage] || `⚠ ${device.fallStage}`;
        fallBadge = `<span class="badge badge-alert"><span class="badge-dot"></span>${label}</span>`;
    } else {
        fallBadge = `<span class="badge badge-normal">✓ Normal</span>`;
    }

    // Temperature
    const temp = device.temperature != null
        ? `<span class="device-temp">${device.temperature.toFixed(1)}°F</span>`
        : `<span class="device-temp dim">—</span>`;

    // WiFi signal
    let wifiBadge;
    if (device.wifiRSSI != null) {
        const rssi = device.wifiRSSI;
        const signalClass = rssi >= -50 ? 'strong' : rssi >= -70 ? 'medium' : 'weak';
        wifiBadge = `<span class="wifi-signal ${signalClass}" title="${device.wifiSSID || ''} (${rssi}dBm)">${getWifiIcon(rssi)} ${rssi}dBm</span>`;
    } else {
        wifiBadge = `<span class="wifi-signal dim">—</span>`;
    }

    const lastSeen = device.lastSeen ? timeAgo(device.lastSeen) : '—';

    return `
    <tr data-device-id="${device.id}">
      <td>
        <div class="device-id-cell">
          <span class="device-serial">${device.serialNumber || device.id}</span>
          ${device.serialNumber ? `<span class="device-id-sub">${device.id}</span>` : ''}
          ${device.model ? `<span class="device-model">${device.model}</span>` : ''}
        </div>
      </td>
      <td>${stateBadge}</td>
      <td>${personBadge}</td>
      <td>${fallBadge}</td>
      <td>${temp}</td>
      <td>${wifiBadge}</td>
      <td><span class="last-seen">${lastSeen}</span></td>
      <td><button class="btn-danger-sm btn-unpair" data-device-id="${device.id}">Unpair</button></td>
    </tr>`;
}

function getWifiIcon(rssi) {
    if (rssi >= -50) return '📶';
    if (rssi >= -70) return '📶';
    return '📶';
}

function renderDeviceRow(device) {
    const existingRow = dom.deviceTableBody.querySelector(`tr[data-device-id="${device.id}"]`);

    if (existingRow) {
        const tempDiv = document.createElement('tbody');
        tempDiv.innerHTML = createDeviceRowHTML(device);
        const newRow = tempDiv.firstElementChild;
        newRow.classList.add('highlight');
        existingRow.replaceWith(newRow);
        attachUnpairHandler(newRow);
    } else {
        const emptyRow = dom.deviceTableBody.querySelector('.empty-row');
        if (emptyRow) dom.deviceTableBody.innerHTML = '';

        const tempDiv = document.createElement('tbody');
        tempDiv.innerHTML = createDeviceRowHTML(device);
        const newRow = tempDiv.firstElementChild;
        newRow.classList.add('highlight');
        dom.deviceTableBody.appendChild(newRow);
        attachUnpairHandler(newRow);
    }

    dom.deviceCountBadge.textContent = `${state.devices.size} device${state.devices.size !== 1 ? 's' : ''}`;
}

function attachUnpairHandlers() {
    // Bind unpair buttons to open the confirmation modal instead of unpairing directly
    dom.deviceTableBody.querySelectorAll('.btn-unpair').forEach((btn) => {
        btn.addEventListener('click', () => {
            const deviceId = btn.dataset.deviceId;
            const device = state.devices.get(deviceId);
            const displayName = device ? (device.serialNumber || device.id) : deviceId;
            openUnpairModal(deviceId, displayName);
        });
    });
}

function attachUnpairHandler(row) {
    const btn = row.querySelector('.btn-unpair');
    if (btn) {
        btn.addEventListener('click', () => {
            const deviceId = btn.dataset.deviceId;
            const device = state.devices.get(deviceId);
            const displayName = device ? (device.serialNumber || device.id) : deviceId;
            openUnpairModal(deviceId, displayName);
        });
    }
}

async function unpairDevice(deviceId) {
    if (!deviceId) return;
    try {
        const res = await fetch(`/api/devices/${deviceId}`, { method: 'DELETE' });
        if (res.ok) {
            state.devices.delete(deviceId);
            renderDeviceTable();
            updateSummary();
            showToast(`Device ${deviceId} unpaired`);
        } else {
            const err = await res.json().catch(() => ({}));
            showToast(`Failed to unpair ${deviceId}`);
            console.error('Unpair failed:', err.error || res.statusText);
        }
    } catch (err) {
        console.error('Failed to unpair device:', err);
        showToast(`Error: ${err.message}`);
    } finally {
        closeUnpairModal();
    }
}

// ─── Alert History ─────────────────────────────────────────────
function renderAlerts() {
    updateAlertCount();
    if (state.alerts.length === 0) {
        dom.alertList.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="empty-icon"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        <p>No alerts</p>
        <span>Fall detection alerts will appear here</span>
      </div>`;
        return;
    }

    dom.alertList.innerHTML = state.alerts.map((a) => createAlertHTML(a)).join('');
    dom.alertList.querySelectorAll('.btn-resolve').forEach((btn) => {
        btn.addEventListener('click', () => resolveAlert(btn.dataset.alertId));
    });
    dom.alertList.querySelectorAll('.btn-dismiss').forEach((btn) => {
        btn.addEventListener('click', () => dismissAlert(btn.dataset.alertId));
    });
}

function createAlertHTML(alert) {
    const isInactive = alert.resolved || alert.dismissed;
    let stateClass = '';
    if (alert.resolved) stateClass = 'resolved';
    else if (alert.dismissed) stateClass = 'dismissed';

    let actionBtns = '';
    if (!isInactive) {
        actionBtns = `<div class="alert-actions"><button class="btn-resolve" data-alert-id="${alert.id}">Resolve</button><button class="btn-dismiss" data-alert-id="${alert.id}">Dismiss</button></div>`;
    } else {
        const isResolved = alert.resolved;
        const statusText = isResolved ? '✓ Resolved' : '∅ Dismissed';
        const colorClass = isResolved ? 'var(--color-success)' : 'var(--text-muted)';
        actionBtns = `<div class="alert-actions" style="font-size: 0.7rem; font-weight: 600; color: ${colorClass}; opacity: 0.8; text-transform: uppercase; letter-spacing: 0.05em;">${statusText}</div>`;
    }

    return `
    <div class="alert-item ${stateClass}" data-alert-id="${alert.id}">
      <div class="alert-dot"></div>
      <div class="alert-content">
        <div class="alert-device">⚠ ${alert.serialNumber || alert.deviceId}</div>
        <div class="alert-message">${alert.message}</div>
        <div class="alert-time">${formatTime(alert.timestamp)}</div>
      </div>
      ${actionBtns}
    </div>`;
}

function renderAlertItem(alert, prepend = false) {
    const emptyState = dom.alertList.querySelector('.empty-state');
    if (emptyState) dom.alertList.innerHTML = '';

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = createAlertHTML(alert);
    const alertEl = tempDiv.firstElementChild;

    if (prepend) {
        dom.alertList.prepend(alertEl);
    } else {
        dom.alertList.appendChild(alertEl);
    }

    const resolveBtn = alertEl.querySelector('.btn-resolve');
    if (resolveBtn) {
        resolveBtn.addEventListener('click', () => resolveAlert(alert.id));
    }
    const dismissBtn = alertEl.querySelector('.btn-dismiss');
    if (dismissBtn) {
        dismissBtn.addEventListener('click', () => dismissAlert(alert.id));
    }
    updateAlertCount();
}

function updateAlertCount() {
    const active = state.alerts.filter((a) => !a.resolved && !a.dismissed).length;
    dom.alertCountBadge.textContent = `${active} alert${active !== 1 ? 's' : ''}`;

    if (active > 0) {
        dom.alertCountBadge.style.background = 'rgba(255, 82, 82, 0.12)';
        dom.alertCountBadge.style.borderColor = 'rgba(255, 82, 82, 0.25)';
        dom.alertCountBadge.style.color = '#ff5252';
    } else {
        dom.alertCountBadge.style.background = '';
        dom.alertCountBadge.style.borderColor = '';
        dom.alertCountBadge.style.color = '';
    }
}

async function resolveAlert(alertId) {
    try {
        const res = await fetch(`/api/alerts/${alertId}/resolve`, { method: 'POST' });
        if (res.ok) {
            const idx = state.alerts.findIndex((a) => a.id === alertId);
            if (idx !== -1) state.alerts[idx].resolved = true;
            renderAlerts();
            updateSummary();
        }
    } catch (err) {
        console.error('Failed to resolve alert:', err);
    }
}

async function dismissAlert(alertId) {
    try {
        const res = await fetch(`/api/alerts/${alertId}/dismiss`, { method: 'POST' });
        if (res.ok) {
            const idx = state.alerts.findIndex((a) => a.id === alertId);
            if (idx !== -1) state.alerts[idx].dismissed = true;
            renderAlerts();
            updateSummary();
        }
    } catch (err) {
        console.error('Failed to dismiss alert:', err);
    }
}

// ─── Pair Device Modal ─────────────────────────────────────────
function openPairModal() {
    dom.pairModal.classList.add('active');
}

function closePairModal() {
    dom.pairModal.classList.remove('active');
}

// ─── Unpair Device Modal ───────────────────────────────────────
function openUnpairModal(deviceId, displayName) {
    state.deviceToUnpair = deviceId;
    if (dom.unpairDeviceName) {
        dom.unpairDeviceName.textContent = displayName;
    }
    dom.unpairModal.classList.add('active');
}

function closeUnpairModal() {
    state.deviceToUnpair = null;
    dom.unpairModal.classList.remove('active');
}

// ─── Copy to Clipboard ────────────────────────────────────────
function copyToClipboard(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;

    const text = el.textContent.trim();
    navigator.clipboard.writeText(text).then(() => {
        showToast(`Copied: ${text}`);

        // Visual feedback on button
        const btn = document.querySelector(`[data-copy="${elementId}"]`);
        if (btn) {
            btn.classList.add('copied');
            setTimeout(() => btn.classList.remove('copied'), 1500);
        }
    }).catch((err) => {
        console.error('Copy failed:', err);
    });
}

// ─── Toast Notification ───────────────────────────────────────
function showToast(message) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast success';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ─── Demo Data ─────────────────────────────────────────────────
async function simulateData() {
    try {
        dom.btnSimulate.style.transform = 'rotate(360deg)';
        dom.btnSimulate.style.transition = 'transform 0.5s ease';

        const res = await fetch('/api/simulate', { method: 'POST' });
        const data = await res.json();

        if (data.success) {
            console.log('[Demo] Generated data for', data.devices.length, 'devices');
        }

        setTimeout(() => { dom.btnSimulate.style.transform = ''; }, 600);
    } catch (err) {
        console.error('Failed to simulate data:', err);
    }
}

// ─── Utilities ─────────────────────────────────────────────────
function timeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 5) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
}

// Refresh last-seen times periodically
setInterval(() => {
    document.querySelectorAll('.last-seen').forEach((el) => {
        const row = el.closest('tr');
        if (row) {
            const deviceId = row.dataset.deviceId;
            const device = state.devices.get(deviceId);
            if (device && device.lastSeen) {
                el.textContent = timeAgo(device.lastSeen);
            }
        }
    });
}, 10000);

// ─── Event Listeners ───────────────────────────────────────────
dom.btnPairDevice.addEventListener('click', openPairModal);
dom.btnCloseModal.addEventListener('click', closePairModal);
dom.btnClosePair.addEventListener('click', closePairModal);
dom.btnSimulate.addEventListener('click', simulateData);

if (dom.btnConfirmUnpair) dom.btnConfirmUnpair.addEventListener('click', () => unpairDevice(state.deviceToUnpair));
if (dom.btnCancelUnpair) dom.btnCancelUnpair.addEventListener('click', closeUnpairModal);

// Close modal on overlay click or Escape
dom.pairModal.addEventListener('click', (e) => {
    if (e.target === dom.pairModal) closePairModal();
});
dom.unpairModal.addEventListener('click', (e) => {
    if (e.target === dom.unpairModal) closeUnpairModal();
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closePairModal();
        closeUnpairModal();
    }
});

// Copy buttons
document.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', () => copyToClipboard(btn.dataset.copy));
});

// ─── Initialize ────────────────────────────────────────────────
connectWebSocket();
console.log('[IoT Monitor] Dashboard initialized');
