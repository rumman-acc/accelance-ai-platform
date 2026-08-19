"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
// ---------- mocks (must be hoisted) ----------
globals_1.jest.mock('geoip-lite', () => ({ lookup: globals_1.jest.fn() }));
globals_1.jest.mock('uuid', () => ({ v4: globals_1.jest.fn() }));
globals_1.jest.mock('posthog-node', () => ({ PostHog: globals_1.jest.fn() }));
globals_1.jest.mock('../../src/utils', () => ({
    getAppVersion: globals_1.jest.fn()
}));
globals_1.jest.mock('../../src/utils/ipValidation', () => ({
    isIPv4: globals_1.jest.fn(),
    isIPv6: globals_1.jest.fn(),
    isValidIPAddress: globals_1.jest.fn()
}));
globals_1.jest.mock('../../src/utils/logger', () => ({
    __esModule: true,
    default: {
        error: globals_1.jest.fn(),
        info: globals_1.jest.fn(),
        warn: globals_1.jest.fn(),
        debug: globals_1.jest.fn()
    },
    auditLogger: {
        log: globals_1.jest.fn()
    }
}));
// ---------- imports under test ----------
const telemetry_1 = require("../../src/utils/telemetry");
const geoip = require('geoip-lite');
const uuid = require('uuid');
const posthogNode = require('posthog-node');
const utils = require('../../src/utils');
const ipValidation = require('../../src/utils/ipValidation');
const loggerModule = require('../../src/utils/logger');
const ORIGINAL_ENV = process.env;
(0, globals_1.describe)('utils/telemetry.ts', () => {
    (0, globals_1.beforeEach)(() => {
        process.env = { ...ORIGINAL_ENV };
        globals_1.jest.clearAllMocks();
        globals_1.jest.useFakeTimers();
        globals_1.jest.setSystemTime(new Date('2026-03-16T12:34:56.000Z'));
        uuid.v4.mockReturnValue('test-uuid-1');
        utils.getAppVersion.mockResolvedValue('3.0.13');
        ipValidation.isValidIPAddress.mockReturnValue(true);
        ipValidation.isIPv4.mockReturnValue(true);
        ipValidation.isIPv6.mockReturnValue(false);
        geoip.lookup.mockReturnValue({ country: 'US', region: 'CA' });
    });
    (0, globals_1.afterEach)(() => {
        globals_1.jest.useRealTimers();
        process.env = ORIGINAL_ENV;
    });
    (0, globals_1.describe)('Telemetry (PostHog) class', () => {
        (0, globals_1.it)('does not create PostHog when POSTHOG_PUBLIC_API_KEY is unset', async () => {
            delete process.env.POSTHOG_PUBLIC_API_KEY;
            const t = new telemetry_1.Telemetry();
            (0, globals_1.expect)(t.postHog).toBeUndefined();
            (0, globals_1.expect)(posthogNode.PostHog).not.toHaveBeenCalled();
        });
        (0, globals_1.it)('creates PostHog when POSTHOG_PUBLIC_API_KEY is set and captures', async () => {
            process.env.POSTHOG_PUBLIC_API_KEY = 'ph-key';
            const capture = globals_1.jest.fn();
            const shutdownAsync = globals_1.jest.fn();
            posthogNode.PostHog.mockImplementation(() => ({ capture, shutdownAsync }));
            const t = new telemetry_1.Telemetry();
            (0, globals_1.expect)(posthogNode.PostHog).toHaveBeenCalledWith('ph-key');
            await t.sendTelemetry('evt', { hello: 'world' }, 'org-1');
            (0, globals_1.expect)(utils.getAppVersion).toHaveBeenCalled();
            (0, globals_1.expect)(capture).toHaveBeenCalledWith({
                event: 'evt',
                distinctId: 'org-1',
                properties: { hello: 'world', version: '3.0.13' }
            });
            await t.flush();
            (0, globals_1.expect)(shutdownAsync).toHaveBeenCalled();
        });
        (0, globals_1.it)('sendTelemetry: uses default args and uuid distinctId when orgId omitted', async () => {
            process.env.POSTHOG_PUBLIC_API_KEY = 'ph-key';
            uuid.v4.mockReturnValue('distinct-uuid-777');
            const capture = globals_1.jest.fn();
            const shutdownAsync = globals_1.jest.fn();
            posthogNode.PostHog.mockImplementation(() => ({ capture, shutdownAsync }));
            const t = new telemetry_1.Telemetry();
            // omit both properties and orgId to hit defaults on line 25
            await t.sendTelemetry('evt-default-args');
            (0, globals_1.expect)(capture).toHaveBeenCalledTimes(1);
            (0, globals_1.expect)(capture).toHaveBeenCalledWith({
                event: 'evt-default-args',
                distinctId: 'distinct-uuid-777', // hits orgId || uuidv4() branch on line 28
                properties: { version: '3.0.13' }
            });
        });
    });
    (0, globals_1.describe)('emitEvent()', () => {
        (0, globals_1.it)('logs an enriched + sanitized event', async () => {
            await (0, telemetry_1.emitEvent)({
                category: telemetry_1.TelemetryEventCategory.SECURITY,
                eventType: 'password-reset-requested',
                actionType: 'update',
                userId: 'user-123',
                orgId: 'org-456',
                resourceId: 'res-789',
                ipAddress: '203.0.113.42',
                result: telemetry_1.TelemetryEventResult.SUCCESS,
                metadata: { tokenExpiryMinutes: 15 }
            });
            (0, globals_1.expect)(loggerModule.auditLogger.log).toHaveBeenCalledTimes(1);
            const payload = loggerModule.auditLogger.log.mock.calls[0][0];
            (0, globals_1.expect)(payload).toEqual(globals_1.expect.objectContaining({
                level: 'info',
                message: 'password-reset-requested',
                eventId: 'test-uuid-1',
                timestamp: '2026-03-16T12:34:56.000Z',
                version: '3.0.13',
                category: 'security',
                eventType: 'password-reset-requested',
                actionType: 'update',
                userId: 'user-123',
                orgId: 'org-456',
                resourceId: 'res-789',
                ipAddress: '203.0.113.xxx',
                countryCode: 'US',
                region: 'CA',
                result: 'success',
                metadata: { tokenExpiryMinutes: '********' }
            }));
        });
        (0, globals_1.it)('invalid IP skips geo enrichment and masks to "unknown"', async () => {
            ipValidation.isValidIPAddress.mockReturnValue(false);
            await (0, telemetry_1.emitEvent)({
                category: telemetry_1.TelemetryEventCategory.AUDIT,
                eventType: 'bad-ip',
                actionType: 'create',
                userId: 'u',
                orgId: 'o',
                ipAddress: 'not-an-ip',
                result: telemetry_1.TelemetryEventResult.SUCCESS
            });
            (0, globals_1.expect)(geoip.lookup).not.toHaveBeenCalled();
            const payload = loggerModule.auditLogger.log.mock.calls[0][0];
            (0, globals_1.expect)(payload.ipAddress).toBe('unknown');
            (0, globals_1.expect)(payload.countryCode).toBeUndefined();
            (0, globals_1.expect)(payload.region).toBeUndefined();
        });
        (0, globals_1.it)('geoip lookup returning null yields no country/region', async () => {
            geoip.lookup.mockReturnValue(null);
            await (0, telemetry_1.emitEvent)({
                category: telemetry_1.TelemetryEventCategory.AUDIT,
                eventType: 'geo-null',
                actionType: 'read',
                userId: 'u',
                orgId: 'o',
                ipAddress: '198.51.100.10',
                result: telemetry_1.TelemetryEventResult.SUCCESS
            });
            const payload = loggerModule.auditLogger.log.mock.calls[0][0];
            (0, globals_1.expect)(payload.countryCode).toBeUndefined();
            (0, globals_1.expect)(payload.region).toBeUndefined();
        });
        (0, globals_1.it)('geoip lookup throw is swallowed and still logs event', async () => {
            geoip.lookup.mockImplementation(() => {
                throw new Error('geo fail');
            });
            await (0, telemetry_1.emitEvent)({
                category: telemetry_1.TelemetryEventCategory.AUDIT,
                eventType: 'geo-throws',
                actionType: 'read',
                userId: 'u',
                orgId: 'o',
                ipAddress: '198.51.100.10',
                result: telemetry_1.TelemetryEventResult.SUCCESS
            });
            (0, globals_1.expect)(loggerModule.default.error).toHaveBeenCalled(); // logs geo error
            (0, globals_1.expect)(loggerModule.auditLogger.log).toHaveBeenCalledTimes(1);
        });
        (0, globals_1.it)('auditLogger.log throwing is swallowed (no throw)', async () => {
            loggerModule.auditLogger.log.mockImplementationOnce(() => {
                throw new Error('sink fail');
            });
            await (0, globals_1.expect)((0, telemetry_1.emitEvent)({
                category: telemetry_1.TelemetryEventCategory.SYSTEM,
                eventType: 'sink-fails',
                actionType: 'execute',
                userId: 'u',
                orgId: 'o',
                result: telemetry_1.TelemetryEventResult.SUCCESS
            })).resolves.toBeUndefined();
            (0, globals_1.expect)(loggerModule.default.error).toHaveBeenCalled();
        });
        (0, globals_1.it)('getAppVersion throwing is swallowed (no throw)', async () => {
            utils.getAppVersion.mockRejectedValueOnce(new Error('version fail'));
            await (0, globals_1.expect)((0, telemetry_1.emitEvent)({
                category: telemetry_1.TelemetryEventCategory.SYSTEM,
                eventType: 'version-fails',
                actionType: 'execute',
                userId: 'u',
                orgId: 'o',
                result: telemetry_1.TelemetryEventResult.SUCCESS
            })).resolves.toBeUndefined();
            (0, globals_1.expect)(loggerModule.default.error).toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=telemetry.test.js.map