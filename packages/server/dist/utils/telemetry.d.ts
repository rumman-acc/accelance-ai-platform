import { PostHog } from 'posthog-node';
export declare enum TelemetryEventType {
    'USER_CREATED' = "user_created",
    'ORGANIZATION_CREATED' = "organization_created"
}
export declare class Telemetry {
    postHog?: PostHog;
    constructor();
    sendTelemetry(event: string, properties?: Record<string, any>, orgId?: string): Promise<void>;
    flush(): Promise<void>;
}
/**
 * Categories for telemetry events, used for filtering and compliance reporting.
 */
export declare enum TelemetryEventCategory {
    AUDIT = "audit",// Compliance and user action tracking (GDPR, HIPAA, ISO 27001)
    METRIC = "metric",// Performance and usage measurements
    SECURITY = "security",// Authentication, authorization, access control events
    SYSTEM = "system"
}
/**
 * Result status for telemetry events.
 */
export declare enum TelemetryEventResult {
    SUCCESS = "success",
    FAILED = "failed"
}
export interface TelemetryEventInput {
    category: TelemetryEventCategory;
    eventType: string;
    actionType: string;
    userId: string;
    orgId: string;
    resourceId?: string;
    ipAddress?: string;
    result: TelemetryEventResult;
    metadata?: Record<string, any>;
}
export interface TelemetryEventOutput {
    eventId: string;
    timestamp: string;
    version: string;
    category: TelemetryEventCategory;
    eventType: string;
    actionType: string;
    userId: string;
    orgId: string;
    resourceId?: string;
    ipAddress?: string;
    countryCode?: string;
    region?: string;
    result: TelemetryEventResult;
    metadata?: Record<string, any>;
}
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
export declare function emitEvent(input: TelemetryEventInput): Promise<void>;
