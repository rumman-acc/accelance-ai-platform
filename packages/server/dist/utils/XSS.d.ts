import { NextFunction, Request, Response } from 'express';
export declare function sanitizeMiddleware(req: Request, res: Response, next: NextFunction): void;
export declare function getAllowedCorsOrigins(): string;
export declare function getAllowCredentials(): boolean;
export declare function getAllowedAuthCorsOrigins(): string[];
export declare function validateCorsConfig(): void;
export declare function getCorsOptions(): any;
/**
 * Retrieves and normalizes allowed iframe embedding origins for CSP frame-ancestors directive.
 *
 * Reads `IFRAME_ORIGINS` environment variable (comma-separated FQDNs) and converts it to
 * space-separated format required by Content Security Policy specification.
 *
 * Input format:
 * - Comma-separated: `https://domain1.com,https://domain2.com`
 * - Special values: `'self'`, `'none'`, or `*`
 * - Default: `'self'` (same-origin only)
 *
 * Output examples:
 * - `https://app.com,https://admin.com` → `https://app.com https://admin.com`
 * - `'self'` → `'self'`
 * - `*` → `*`
 *
 * @returns Space-separated string for CSP frame-ancestors directive
 */
export declare function getAllowedIframeOrigins(): string;
export declare function getIframeSecurityHeaders(): Record<string, string>;
