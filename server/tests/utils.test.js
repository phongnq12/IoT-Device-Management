import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const { getLocalIP } = require('../utils');

describe('utils', () => {
    describe('getLocalIP', () => {
        it('returns a valid IPv4 string', () => {
            const ip = getLocalIP();
            expect(ip).toBeTypeOf('string');
            expect(ip).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
        });

        it('does not return empty string', () => {
            const ip = getLocalIP();
            expect(ip.length).toBeGreaterThan(0);
        });
    });
});
