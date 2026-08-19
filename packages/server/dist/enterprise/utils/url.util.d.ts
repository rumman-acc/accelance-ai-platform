/**
 * Ensures the APP_URL uses HTTPS protocol for security-sensitive operations.
 * Allows HTTP only for localhost/127.0.0.1 (development environments).
 *
 * @param path - Optional path to append to the base URL
 * @returns Secure URL (HTTPS) or development URL (HTTP localhost)
 */
export declare function getSecureAppUrl(path?: string): string;
/**
 * Constructs a secure link with a token parameter.
 * Always uses HTTPS for non-localhost URLs.
 *
 * @param path - URL path (e.g., '/reset-password', '/verify')
 * @param token - Security token to include in URL
 * @returns Secure URL with token parameter
 */
export declare function getSecureTokenLink(path: string, token: string): string;
