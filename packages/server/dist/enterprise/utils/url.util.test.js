"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
jest.mock('../../utils/logger', () => ({
    __esModule: true,
    default: { warn: jest.fn(), info: jest.fn(), error: jest.fn(), debug: jest.fn() }
}));
const url_util_1 = require("./url.util");
(0, globals_1.describe)('URL Security Utilities', () => {
    const originalEnv = process.env.APP_URL;
    (0, globals_1.afterEach)(() => {
        if (originalEnv) {
            process.env.APP_URL = originalEnv;
        }
        else {
            delete process.env.APP_URL;
        }
    });
    (0, globals_1.describe)('getSecureAppUrl', () => {
        (0, globals_1.it)('should throw error if APP_URL is not configured', () => {
            delete process.env.APP_URL;
            (0, globals_1.expect)(() => (0, url_util_1.getSecureAppUrl)()).toThrow('APP_URL environment variable is not configured');
        });
        (0, globals_1.it)('should throw error if APP_URL is not a valid URL', () => {
            process.env.APP_URL = 'example.com';
            (0, globals_1.expect)(() => (0, url_util_1.getSecureAppUrl)()).toThrow('APP_URL environment variable is not a valid URL: "example.com"');
        });
        (0, globals_1.it)('should return HTTPS URL unchanged', () => {
            process.env.APP_URL = 'https://example.com';
            (0, globals_1.expect)((0, url_util_1.getSecureAppUrl)()).toBe('https://example.com');
        });
        (0, globals_1.it)('should convert HTTP to HTTPS for production URLs', () => {
            process.env.APP_URL = 'http://example.com';
            const result = (0, url_util_1.getSecureAppUrl)();
            (0, globals_1.expect)(result).toBe('https://example.com');
        });
        (0, globals_1.it)('should allow HTTP for localhost', () => {
            process.env.APP_URL = 'http://localhost:3000';
            (0, globals_1.expect)((0, url_util_1.getSecureAppUrl)()).toBe('http://localhost:3000');
        });
        (0, globals_1.it)('should allow HTTP for 127.0.0.1', () => {
            process.env.APP_URL = 'http://127.0.0.1:3000';
            (0, globals_1.expect)((0, url_util_1.getSecureAppUrl)()).toBe('http://127.0.0.1:3000');
        });
        (0, globals_1.it)('should allow HTTP for ::1 (IPv6 localhost)', () => {
            process.env.APP_URL = 'http://[::1]:3000';
            (0, globals_1.expect)((0, url_util_1.getSecureAppUrl)()).toBe('http://[::1]:3000');
        });
        (0, globals_1.it)('should allow HTTP for 0.0.0.0', () => {
            process.env.APP_URL = 'http://0.0.0.0:3000';
            (0, globals_1.expect)((0, url_util_1.getSecureAppUrl)()).toBe('http://0.0.0.0:3000');
        });
        (0, globals_1.it)('should append path correctly', () => {
            process.env.APP_URL = 'https://example.com';
            (0, globals_1.expect)((0, url_util_1.getSecureAppUrl)('/reset-password')).toBe('https://example.com/reset-password');
        });
        (0, globals_1.it)('should handle trailing slash in base URL', () => {
            process.env.APP_URL = 'https://example.com/';
            (0, globals_1.expect)((0, url_util_1.getSecureAppUrl)('/reset-password')).toBe('https://example.com/reset-password');
        });
        (0, globals_1.it)('should handle path without leading slash', () => {
            process.env.APP_URL = 'https://example.com';
            (0, globals_1.expect)((0, url_util_1.getSecureAppUrl)('reset-password')).toBe('https://example.com/reset-password');
        });
        (0, globals_1.it)('should convert HTTP to HTTPS and append path', () => {
            process.env.APP_URL = 'http://example.com';
            (0, globals_1.expect)((0, url_util_1.getSecureAppUrl)('/verify')).toBe('https://example.com/verify');
        });
    });
    (0, globals_1.describe)('getSecureTokenLink', () => {
        (0, globals_1.it)('should create secure link with token', () => {
            process.env.APP_URL = 'https://example.com';
            const result = (0, url_util_1.getSecureTokenLink)('/reset-password', 'abc123');
            (0, globals_1.expect)(result).toBe('https://example.com/reset-password?token=abc123');
        });
        (0, globals_1.it)('should convert HTTP to HTTPS in token link', () => {
            process.env.APP_URL = 'http://example.com';
            const result = (0, url_util_1.getSecureTokenLink)('/reset-password', 'abc123');
            (0, globals_1.expect)(result).toBe('https://example.com/reset-password?token=abc123');
        });
        (0, globals_1.it)('should allow HTTP localhost in token link', () => {
            process.env.APP_URL = 'http://localhost:3000';
            const result = (0, url_util_1.getSecureTokenLink)('/verify', 'xyz789');
            (0, globals_1.expect)(result).toBe('http://localhost:3000/verify?token=xyz789');
        });
        (0, globals_1.it)('should encode tokens for use in query strings', () => {
            process.env.APP_URL = 'https://example.com';
            const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0';
            const result = (0, url_util_1.getSecureTokenLink)('/register', token);
            (0, globals_1.expect)(result).toBe(`https://example.com/register?token=${encodeURIComponent(token)}`);
        });
    });
    (0, globals_1.describe)('Security scenarios', () => {
        (0, globals_1.it)('should prevent HTTP password reset links in production', () => {
            process.env.APP_URL = 'http://myapp.com';
            const resetLink = (0, url_util_1.getSecureTokenLink)('/reset-password', 'secret-token');
            (0, globals_1.expect)(resetLink).toMatch(/^https:\/\//);
            (0, globals_1.expect)(resetLink).not.toMatch(/^http:\/\//);
        });
        (0, globals_1.it)('should prevent HTTP verification links in production', () => {
            process.env.APP_URL = 'http://myapp.com';
            const verifyLink = (0, url_util_1.getSecureTokenLink)('/verify', 'verify-token');
            (0, globals_1.expect)(verifyLink).toMatch(/^https:\/\//);
        });
        (0, globals_1.it)('should prevent HTTP registration links in production', () => {
            process.env.APP_URL = 'http://myapp.com';
            const registerLink = (0, url_util_1.getSecureTokenLink)('/register', 'invite-token');
            (0, globals_1.expect)(registerLink).toMatch(/^https:\/\//);
        });
    });
});
//# sourceMappingURL=url.util.test.js.map