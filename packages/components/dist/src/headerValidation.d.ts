/**
 * Validates a set of user-supplied HTTP headers intended for outbound requests.
 * Rejects malformed keys, CRLF/control-char injection in values, hop-by-hop and
 * sensitive header names, and oversized payloads. Throws a plain Error; callers
 * are responsible for mapping to their own error types.
 */
export declare function validateCustomHeaders(headers: Record<string, string>): void;
/**
 * Returns a copy of `headers` with credential-bearing entries (Authorization, Cookie, X-Api-Key, …)
 * replaced by a placeholder string. Used at trust boundaries before a header bag is exposed to flow
 * templates, observers, or logs. Comparison is case-insensitive; non-sensitive headers pass through.
 */
export declare function redactSensitiveHeaders(headers: Record<string, any> | undefined | null): Record<string, any>;
