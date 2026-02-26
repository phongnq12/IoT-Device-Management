export function timeAgo(dateString) {
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

export function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
}

export function escapeHTML(str) {
    if (typeof str !== 'string') return str;
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

export function copyToClipboard(text) {
    return navigator.clipboard.writeText(text);
}

export function getWifiSignalClass(rssi) {
    if (rssi >= -50) return 'strong';
    if (rssi >= -70) return 'medium';
    return 'weak';
}

export function getDeviceStateClass(state) {
    const stateMap = {
        'online': 'online', 'monitoring': 'online', 'learning': 'learning',
        'initializing': 'init', 'rebooting': 'init', 'software update': 'init',
        'offline': 'offline', 'silent': 'silent', 'test': 'test', 'suspend': 'silent',
    };
    return stateMap[state] || 'offline';
}

export function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getFallStageLabel(stage) {
    const labels = {
        'fall_detected': '⚠ Detected',
        'fall_confirmed': '🚨 Confirmed',
        'calling': '📞 Calling',
        'fall_suspected': '⚠ Suspected',
    };
    return labels[stage] || `⚠ ${stage}`;
}
