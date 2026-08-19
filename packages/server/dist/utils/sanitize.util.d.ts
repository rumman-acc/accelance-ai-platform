import { User } from '../enterprise/database/entities/user.entity';
export declare function sanitizeNullBytes(obj: any): any;
export declare function sanitizeUser(user: Partial<User>): Partial<User>;
/**
 * Masks the last octet of an IP address for privacy (GDPR compliance).
 *
 * This function sanitizes IP addresses by masking identifying information while
 * preserving network information. For IPv4, the last octet is masked. For IPv6,
 * the last 64 bits (interface identifier) are masked.
 *
 * @param ip - The IP address string to sanitize (IPv4 or IPv6 format)
 * @returns The sanitized IP address with masked octets/bits, or 'unknown' if invalid
 */
export declare function sanitizeIPAddress(ip: string): string;
/**
 * Sanitizes audit-event metadata by redacting sensitive fields and removing null bytes.
 *
 * - Redacts values for keys whose names look sensitive (case-insensitive substring match),
 *   e.g. "password", "token", "secret", "authorization", etc.
 * - Runs `sanitizeNullBytes()` to remove any `\u0000` characters from string values.
 *
 * Note: `sanitizeNullBytes()` mutates nested objects/arrays. Since this function only
 * shallow-clones the input, nested objects may still be shared with the caller.
 *
 * @param metadata - Arbitrary event metadata (key/value pairs)
 * @returns A sanitized metadata object safe for audit logging
 */
export declare function sanitizeAuditMetadata(metadata: Record<string, any> | undefined | null): Record<string, any>;
