import { describe, it, expect } from 'vitest';
import {
    getWifiSignalClass,
    getDeviceStateClass,
    capitalize,
    getFallStageLabel,
} from './utils';

describe('client utils', () => {
    describe('getWifiSignalClass', () => {
        it('returns "strong" for rssi >= -50', () => {
            expect(getWifiSignalClass(-30)).toBe('strong');
            expect(getWifiSignalClass(-50)).toBe('strong');
        });

        it('returns "medium" for -70 <= rssi < -50', () => {
            expect(getWifiSignalClass(-51)).toBe('medium');
            expect(getWifiSignalClass(-70)).toBe('medium');
        });

        it('returns "weak" for rssi < -70', () => {
            expect(getWifiSignalClass(-71)).toBe('weak');
            expect(getWifiSignalClass(-90)).toBe('weak');
        });
    });

    describe('getDeviceStateClass', () => {
        it('maps "monitoring" to "online"', () => {
            expect(getDeviceStateClass('monitoring')).toBe('online');
        });

        it('maps "learning" to "learning"', () => {
            expect(getDeviceStateClass('learning')).toBe('learning');
        });

        it('maps "initializing" to "init"', () => {
            expect(getDeviceStateClass('initializing')).toBe('init');
        });

        it('maps "rebooting" to "init"', () => {
            expect(getDeviceStateClass('rebooting')).toBe('init');
        });

        it('maps "silent" to "silent"', () => {
            expect(getDeviceStateClass('silent')).toBe('silent');
        });

        it('maps "suspend" to "silent"', () => {
            expect(getDeviceStateClass('suspend')).toBe('silent');
        });

        it('returns "offline" for unknown states', () => {
            expect(getDeviceStateClass('unknown')).toBe('offline');
            expect(getDeviceStateClass(undefined)).toBe('offline');
        });
    });

    describe('capitalize', () => {
        it('capitalizes first letter', () => {
            expect(capitalize('hello')).toBe('Hello');
        });

        it('returns empty string for falsy input', () => {
            expect(capitalize('')).toBe('');
            expect(capitalize(null)).toBe('');
            expect(capitalize(undefined)).toBe('');
        });

        it('handles single character', () => {
            expect(capitalize('a')).toBe('A');
        });
    });

    describe('getFallStageLabel', () => {
        it('returns correct label for known stages', () => {
            expect(getFallStageLabel('fall_detected')).toBe('⚠ Detected');
            expect(getFallStageLabel('fall_confirmed')).toBe('🚨 Confirmed');
            expect(getFallStageLabel('calling')).toBe('📞 Calling');
            expect(getFallStageLabel('fall_suspected')).toBe('⚠ Suspected');
        });

        it('returns fallback for unknown stage', () => {
            expect(getFallStageLabel('unknown_stage')).toBe('⚠ unknown_stage');
        });
    });
});
