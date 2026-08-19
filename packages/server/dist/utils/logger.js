"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogger = void 0;
exports.expressRequestLogger = expressRequestLogger;
const accelance_components_1 = require("accelance-components");
const fs = __importStar(require("fs"));
const winston_1 = require("winston");
const config_1 = __importDefault(require("./config")); // should be replaced by node-config or similar
const { combine, timestamp, printf, errors } = winston_1.format;
let requestLogger;
const provider = accelance_components_1.StorageProviderFactory.getProvider();
const serverTransports = provider.getLoggerTransports('server', config_1.default);
const errorTransports = provider.getLoggerTransports('error', config_1.default);
const requestTransports = provider.getLoggerTransports('requests', config_1.default);
const auditTransports = provider.getLoggerTransports('audit', config_1.default);
// expect the log dir be relative to the projects root
const logDir = config_1.default.logging.dir;
// Create the log directory if it doesn't exist
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}
const logger = (0, winston_1.createLogger)({
    format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.format.json(), printf(({ level, message, timestamp, stack }) => {
        const text = `${timestamp} [${level.toUpperCase()}]: ${message}`;
        return stack ? text + '\n' + stack : text;
    }), errors({ stack: true })),
    defaultMeta: {
        package: 'server'
    },
    exitOnError: false,
    transports: [new winston_1.transports.Console(), ...serverTransports],
    exceptionHandlers: [...(process.env.DEBUG && process.env.DEBUG === 'true' ? [new winston_1.transports.Console()] : []), ...errorTransports],
    rejectionHandlers: [
        ...(process.env.DEBUG && process.env.DEBUG === 'true' ? [new winston_1.transports.Console()] : []),
        ...errorTransports,
        // Always provide a fallback rejection handler when no other handlers are configured
        ...((!process.env.DEBUG || process.env.DEBUG !== 'true') && errorTransports.length === 0 ? [new winston_1.transports.Console()] : [])
    ]
});
requestLogger = (0, winston_1.createLogger)({
    format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.format.json(), errors({ stack: true })),
    defaultMeta: {
        package: 'server'
    },
    transports: [...(process.env.DEBUG && process.env.DEBUG === 'true' ? [new winston_1.transports.Console()] : []), ...requestTransports]
});
function getSensitiveBodyFields() {
    if (!process.env.LOG_SANITIZE_BODY_FIELDS)
        return [];
    return process.env.LOG_SANITIZE_BODY_FIELDS
        .toLowerCase()
        .split(',')
        .map((f) => f.trim());
}
function getSensitiveHeaderFields() {
    if (!process.env.LOG_SANITIZE_HEADER_FIELDS)
        return [];
    return process.env.LOG_SANITIZE_HEADER_FIELDS
        .toLowerCase()
        .split(',')
        .map((f) => f.trim());
}
function sanitizeObject(obj) {
    if (!obj || typeof obj !== 'object')
        return obj;
    const sensitiveFields = getSensitiveBodyFields();
    const sanitized = Array.isArray(obj) ? [...obj] : { ...obj };
    Object.keys(sanitized).forEach((key) => {
        const lowerKey = key.toLowerCase();
        if (sensitiveFields.includes(lowerKey)) {
            sanitized[key] = '********';
        }
        else if (typeof sanitized[key] === 'string') {
            if (sanitized[key].includes('@') && sanitized[key].includes('.')) {
                sanitized[key] = sanitized[key].replace(/([^@\s]+)@([^@\s]+)/g, '**********');
            }
        }
    });
    return sanitized;
}
function expressRequestLogger(req, res, next) {
    const unwantedLogURLs = ['/api/node-icon/', '/api/components-credentials-icon/', '/api/ping'];
    if (/\/api\//i.test(req.url) && !unwantedLogURLs.some((url) => new RegExp(url, 'i').test(req.url))) {
        const isDebugLevel = logger.level === 'debug' || process.env.DEBUG === 'true';
        const requestMetadata = {
            request: {
                method: req.method,
                url: req.url,
                params: req.params
            }
        };
        // Only include headers, body, and query if log level is debug
        if (isDebugLevel) {
            const sanitizedBody = sanitizeObject(req.body);
            const sanitizedQuery = sanitizeObject(req.query);
            const sanitizedHeaders = { ...req.headers };
            const sensitiveHeaders = getSensitiveHeaderFields();
            sensitiveHeaders.forEach((header) => {
                if (sanitizedHeaders[header]) {
                    sanitizedHeaders[header] = '********';
                }
            });
            requestMetadata.request.body = sanitizedBody;
            requestMetadata.request.query = sanitizedQuery;
            requestMetadata.request.headers = sanitizedHeaders;
        }
        const getRequestEmoji = (method) => {
            const requetsEmojis = {
                GET: '⬇️',
                POST: '⬆️',
                PUT: '🖊',
                DELETE: '❌',
                OPTION: '🔗'
            };
            return requetsEmojis[method] || '?';
        };
        if (req.method !== 'GET') {
            requestLogger.info(`${getRequestEmoji(req.method)} ${req.method} ${req.url}`);
            logger.info(`${getRequestEmoji(req.method)} ${req.method} ${req.url}`);
        }
        else {
            requestLogger.http(`${getRequestEmoji(req.method)} ${req.method} ${req.url}`);
        }
    }
    next();
}
exports.auditLogger = (0, winston_1.createLogger)({
    format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.format.json(), errors({ stack: true })),
    defaultMeta: { package: 'server' },
    exitOnError: false,
    transports: [...(process.env.DEBUG === 'true' ? [new winston_1.transports.Console()] : []), ...auditTransports]
});
exports.default = logger;
//# sourceMappingURL=logger.js.map