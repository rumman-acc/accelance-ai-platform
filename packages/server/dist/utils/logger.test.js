"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
// ---------- mocks (must be hoisted) ----------
const mockExistsSync = globals_1.jest.fn();
const mockMkdirSync = globals_1.jest.fn();
globals_1.jest.mock('fs', () => ({
    existsSync: (...args) => mockExistsSync(...args),
    mkdirSync: (...args) => mockMkdirSync(...args)
}));
globals_1.jest.mock('accelance-components', () => {
    const winston = require('winston');
    return {
        StorageProviderFactory: {
            getProvider: globals_1.jest.fn(() => ({
                getLoggerTransports: globals_1.jest.fn(() => [new winston.transports.Console()])
            }))
        }
    };
});
globals_1.jest.mock('../../src/utils/config', () => ({
    __esModule: true,
    default: {
        logging: { dir: '/tmp/flowise-test-logs' }
    }
}));
// ---------- load logger only after mocks (so our mocks are used) ----------
let logger;
let expressRequestLogger;
let auditLogger;
const ORIGINAL_ENV = process.env;
(0, globals_1.describe)('logger.ts', () => {
    (0, globals_1.beforeAll)(() => {
        mockExistsSync.mockReturnValue(false); // so line 22 (mkdirSync) runs when module loads
        globals_1.jest.resetModules();
        const mod = require('../../src/utils/logger');
        logger = mod.default;
        expressRequestLogger = mod.expressRequestLogger;
        auditLogger = mod.auditLogger;
        // Assert here so beforeEach's clearAllMocks() doesn't wipe call history
        (0, globals_1.expect)(mockExistsSync).toHaveBeenCalled();
        (0, globals_1.expect)(mockMkdirSync).toHaveBeenCalled();
    });
    (0, globals_1.beforeEach)(() => {
        process.env = { ...ORIGINAL_ENV };
        globals_1.jest.clearAllMocks();
    });
    (0, globals_1.afterEach)(() => {
        process.env = ORIGINAL_ENV;
    });
    (0, globals_1.describe)('expressRequestLogger', () => {
        const next = globals_1.jest.fn();
        (0, globals_1.it)('calls next()', () => {
            const req = { url: '/api/chatflows', method: 'GET', params: {} };
            expressRequestLogger(req, {}, next);
            (0, globals_1.expect)(next).toHaveBeenCalled();
        });
        (0, globals_1.it)('does not log when URL is in unwantedLogURLs (ping)', () => {
            const req = { url: '/api/ping', method: 'GET', params: {} };
            const infoSpy = globals_1.jest.spyOn(logger, 'info').mockImplementation(() => { });
            expressRequestLogger(req, {}, next);
            (0, globals_1.expect)(next).toHaveBeenCalled();
            (0, globals_1.expect)(infoSpy).not.toHaveBeenCalled();
            infoSpy.mockRestore();
        });
        (0, globals_1.it)('does not log when URL is in unwantedLogURLs (node-icon)', () => {
            const req = { url: '/api/node-icon/xyz', method: 'GET', params: {} };
            const infoSpy = globals_1.jest.spyOn(logger, 'info').mockImplementation(() => { });
            expressRequestLogger(req, {}, next);
            (0, globals_1.expect)(next).toHaveBeenCalled();
            (0, globals_1.expect)(infoSpy).not.toHaveBeenCalled();
            infoSpy.mockRestore();
        });
        (0, globals_1.it)('does not log when URL does not match /api/', () => {
            const req = { url: '/health', method: 'GET', params: {} };
            const infoSpy = globals_1.jest.spyOn(logger, 'info').mockImplementation(() => { });
            expressRequestLogger(req, {}, next);
            (0, globals_1.expect)(next).toHaveBeenCalled();
            (0, globals_1.expect)(infoSpy).not.toHaveBeenCalled();
            infoSpy.mockRestore();
        });
        (0, globals_1.it)('logs GET request (requestLogger.http path)', () => {
            const req = { url: '/api/chatflows', method: 'GET', params: {} };
            expressRequestLogger(req, {}, next);
            (0, globals_1.expect)(next).toHaveBeenCalled();
        });
        (0, globals_1.it)('logs POST request (requestLogger.info + logger.info path)', () => {
            const req = { url: '/api/chatflows', method: 'POST', params: {} };
            const infoSpy = globals_1.jest.spyOn(logger, 'info').mockImplementation(() => { });
            expressRequestLogger(req, {}, next);
            (0, globals_1.expect)(next).toHaveBeenCalled();
            (0, globals_1.expect)(infoSpy).toHaveBeenCalled();
            infoSpy.mockRestore();
        });
        (0, globals_1.it)('logs PUT request', () => {
            const req = { url: '/api/chatflows/1', method: 'PUT', params: {} };
            const infoSpy = globals_1.jest.spyOn(logger, 'info').mockImplementation(() => { });
            expressRequestLogger(req, {}, next);
            (0, globals_1.expect)(infoSpy).toHaveBeenCalled();
            infoSpy.mockRestore();
        });
        (0, globals_1.it)('logs DELETE request', () => {
            const req = { url: '/api/chatflows/1', method: 'DELETE', params: {} };
            const infoSpy = globals_1.jest.spyOn(logger, 'info').mockImplementation(() => { });
            expressRequestLogger(req, {}, next);
            (0, globals_1.expect)(infoSpy).toHaveBeenCalled();
            infoSpy.mockRestore();
        });
        (0, globals_1.it)('when DEBUG=true runs sanitization (getSensitiveBodyFields, getSensitiveHeaderFields, sanitizeObject)', () => {
            process.env.DEBUG = 'true';
            process.env.LOG_SANITIZE_BODY_FIELDS = 'password,secret';
            process.env.LOG_SANITIZE_HEADER_FIELDS = 'authorization';
            const req = {
                url: '/api/chatflows',
                method: 'POST',
                params: {},
                body: { password: 'mypass', user: 'john@example.com' },
                query: { token: 'x@y.z' },
                headers: { authorization: 'Bearer xxx', 'content-type': 'application/json' }
            };
            const res = {};
            expressRequestLogger(req, res, next);
            (0, globals_1.expect)(next).toHaveBeenCalled();
        });
        (0, globals_1.it)('when DEBUG=true and no sanitize env vars still includes body/query/headers', () => {
            process.env.DEBUG = 'true';
            delete process.env.LOG_SANITIZE_BODY_FIELDS;
            delete process.env.LOG_SANITIZE_HEADER_FIELDS;
            const req = {
                url: '/api/chatflows',
                method: 'POST',
                params: {},
                body: { foo: 1 },
                query: {},
                headers: {}
            };
            expressRequestLogger(req, {}, next);
            (0, globals_1.expect)(next).toHaveBeenCalled();
        });
    });
    (0, globals_1.describe)('exports', () => {
        (0, globals_1.it)('default logger has log methods', () => {
            (0, globals_1.expect)(logger.info).toBeDefined();
            (0, globals_1.expect)(logger.error).toBeDefined();
            (0, globals_1.expect)(logger.warn).toBeDefined();
            (0, globals_1.expect)(logger.debug).toBeDefined();
        });
        (0, globals_1.it)('auditLogger is defined', () => {
            (0, globals_1.expect)(auditLogger).toBeDefined();
            (0, globals_1.expect)(typeof auditLogger.log).toBe('function');
        });
    });
});
//# sourceMappingURL=logger.test.js.map