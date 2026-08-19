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
exports.TelemetryEventResult = exports.TelemetryEventCategory = exports.Telemetry = exports.TelemetryEventType = void 0;
exports.emitEvent = emitEvent;
const geoip_lite_1 = __importDefault(require("geoip-lite"));
const posthog_node_1 = require("posthog-node");
const uuid_1 = require("uuid");
const utils_1 = require("../utils");
const ipValidation_1 = require("./ipValidation");
const logger_1 = __importStar(require("./logger"));
const sanitize_util_1 = require("./sanitize.util");
var TelemetryEventType;
(function (TelemetryEventType) {
    TelemetryEventType["USER_CREATED"] = "user_created";
    TelemetryEventType["ORGANIZATION_CREATED"] = "organization_created";
})(TelemetryEventType || (exports.TelemetryEventType = TelemetryEventType = {}));
class Telemetry {
    constructor() {
        if (process.env.POSTHOG_PUBLIC_API_KEY) {
            this.postHog = new posthog_node_1.PostHog(process.env.POSTHOG_PUBLIC_API_KEY);
        }
        else {
            this.postHog = undefined;
        }
    }
    async sendTelemetry(event, properties = {}, orgId = '') {
        properties.version = await (0, utils_1.getAppVersion)();
        if (this.postHog) {
            const distinctId = orgId || (0, uuid_1.v4)();
            this.postHog.capture({
                event,
                distinctId,
                properties
            });
        }
    }
    async flush() {
        if (this.postHog) {
            await this.postHog.shutdownAsync();
        }
    }
}
exports.Telemetry = Telemetry;
/**
 * Derives country code and region from an IP address using GeoIP lookup.
 *
 * This function performs a non-blocking geolocation lookup to extract geographic
 * information before the IP address is masked for privacy compliance. Returns
 * ISO country codes and region identifiers that are GDPR/HIPAA compliant.
 *
 * @param ipAddress - The IP address string to geolocate (must be valid IPv4 or IPv6)
 * @returns An object containing optional `countryCode` (ISO 3166-1 alpha-2) and `region` (state/province), or empty object if lookup fails or IP is invalid
 */
function getGeolocation(ipAddress) {
    if (!(0, ipValidation_1.isValidIPAddress)(ipAddress)) {
        return {};
    }
    try {
        const geo = geoip_lite_1.default.lookup(ipAddress);
        if (!geo)
            return {};
        return {
            countryCode: geo.country,
            region: geo.region
        };
    }
    catch (error) {
        logger_1.default.error(`Failed to resolve geolocation for IP: ${error}`);
        return {};
    }
}
/**
 * Categories for telemetry events, used for filtering and compliance reporting.
 */
var TelemetryEventCategory;
(function (TelemetryEventCategory) {
    TelemetryEventCategory["AUDIT"] = "audit";
    TelemetryEventCategory["METRIC"] = "metric";
    TelemetryEventCategory["SECURITY"] = "security";
    TelemetryEventCategory["SYSTEM"] = "system"; // Operational events (startup, shutdown, errors)
})(TelemetryEventCategory || (exports.TelemetryEventCategory = TelemetryEventCategory = {}));
/**
 * Result status for telemetry events.
 */
var TelemetryEventResult;
(function (TelemetryEventResult) {
    TelemetryEventResult["SUCCESS"] = "success";
    TelemetryEventResult["FAILED"] = "failed";
})(TelemetryEventResult || (exports.TelemetryEventResult = TelemetryEventResult = {}));
/**
 * Emits a structured audit/telemetry event to the configured audit log sink.
 *
 * Builds a `TelemetryEventOutput` record and writes it via `auditLogger` (provider-backed transports),
 * enabling storage on local/S3/GCS/Azure depending on `STORAGE_TYPE`.
 *
 * Enrichment & sanitization:
 * - Adds `eventId` (UUID v4), `timestamp` (ISO 8601), and `version` (app version).
 * - If `ipAddress` is provided, attempts GeoIP lookup first to derive `countryCode`/`region`,
 *   then masks the IP via `sanitizeIPAddress` before logging.
 * - Redacts sensitive keys inside `metadata` via `sanitizeAuditMetadata`.
 *
 * Reliability:
 * - Best-effort / non-blocking: failures are caught and logged; this function does not throw.
 *
 * @param input - The event input describing category/action/outcome and optional context.
 * @returns Resolves when the event has been handed off to the logger transport.
 */
async function emitEvent(input) {
    try {
        const geo = input.ipAddress ? getGeolocation(input.ipAddress) : {};
        const event = {
            eventId: (0, uuid_1.v4)(),
            timestamp: new Date().toISOString(),
            version: await (0, utils_1.getAppVersion)(),
            category: input.category,
            eventType: input.eventType,
            actionType: input.actionType,
            userId: input.userId,
            orgId: input.orgId,
            resourceId: input.resourceId,
            ipAddress: input.ipAddress ? (0, sanitize_util_1.sanitizeIPAddress)(input.ipAddress) : undefined,
            countryCode: geo.countryCode,
            region: geo.region,
            result: input.result,
            metadata: input.metadata ? (0, sanitize_util_1.sanitizeAuditMetadata)(input.metadata) : undefined
        };
        logger_1.auditLogger.log({ level: 'info', message: event.eventType, ...event });
    }
    catch (error) {
        logger_1.default.error(`Failed to emit event: ${error}`);
    }
}
//# sourceMappingURL=telemetry.js.map