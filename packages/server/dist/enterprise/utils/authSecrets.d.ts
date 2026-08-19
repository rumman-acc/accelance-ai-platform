/**
 * Initialize auth secrets from env (backwards compat) → AWS Secrets Manager → filesystem.
 * Each secret is generated with crypto.randomBytes(32) when created (or 'Accelance' for JWT_ISSUER/JWT_AUDIENCE).
 * Call once after getEncryptionKey() in initDatabase().
 */
export declare function initAuthSecrets(): Promise<void>;
export declare function getTokenHashSecret(): string;
export declare function getExpressSessionSecret(): string;
export declare function getJWTAuthTokenSecret(): string;
export declare function getJWTRefreshTokenSecret(): string;
export declare function getJWTIssuer(): string;
export declare function getJWTAudience(): string;
