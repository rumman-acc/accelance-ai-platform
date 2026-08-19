"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initAuthSecrets = initAuthSecrets;
exports.getTokenHashSecret = getTokenHashSecret;
exports.getExpressSessionSecret = getExpressSessionSecret;
exports.getJWTAuthTokenSecret = getJWTAuthTokenSecret;
exports.getJWTRefreshTokenSecret = getJWTRefreshTokenSecret;
exports.getJWTIssuer = getJWTIssuer;
exports.getJWTAudience = getJWTAudience;
const utils_1 = require("../../utils");
/**
 * Weak default values that were previously hardcoded when env vars were not set.
 * If the user has set a var to one of these, we treat it as "not set" and use file/AWS storage instead.
 */
const WEAK_DEFAULTS = {
    JWT_AUTH_TOKEN_SECRET: 'AABBCCDDAABBCCDDAABBCCDDAABBCCDDAABBCCDD',
    JWT_REFRESH_TOKEN_SECRET: 'AABBCCDDAABBCCDDAABBCCDDAABBCCDDAABBCCDD',
    EXPRESS_SESSION_SECRET: 'accelance',
    TOKEN_HASH_SECRET: 'popcorn'
};
let tokenHashSecret;
let expressSessionSecret;
let jwtAuthTokenSecret;
let jwtRefreshTokenSecret;
let jwtIssuer;
let jwtAudience;
const NOT_INITIALIZED = 'Auth secrets not initialized. Call initAuthSecrets() first.';
/**
 * Initialize auth secrets from env (backwards compat) → AWS Secrets Manager → filesystem.
 * Each secret is generated with crypto.randomBytes(32) when created (or 'Accelance' for JWT_ISSUER/JWT_AUDIENCE).
 * Call once after getEncryptionKey() in initDatabase().
 */
async function initAuthSecrets() {
    tokenHashSecret = await (0, utils_1.getOrCreateStoredSecret)({
        envKey: 'TOKEN_HASH_SECRET',
        fileName: 'token_hash_secret.key',
        awsSecretIdSuffix: 'TokenHashSecret',
        weakDefault: WEAK_DEFAULTS.TOKEN_HASH_SECRET
    });
    expressSessionSecret = await (0, utils_1.getOrCreateStoredSecret)({
        envKey: 'EXPRESS_SESSION_SECRET',
        fileName: 'express_session_secret.key',
        awsSecretIdSuffix: 'ExpressSessionSecret',
        weakDefault: WEAK_DEFAULTS.EXPRESS_SESSION_SECRET
    });
    jwtAuthTokenSecret = await (0, utils_1.getOrCreateStoredSecret)({
        envKey: 'JWT_AUTH_TOKEN_SECRET',
        fileName: 'jwt_auth_token_secret.key',
        awsSecretIdSuffix: 'JWTAuthTokenSecret',
        weakDefault: WEAK_DEFAULTS.JWT_AUTH_TOKEN_SECRET
    });
    jwtRefreshTokenSecret = await (0, utils_1.getOrCreateStoredSecret)({
        envKey: 'JWT_REFRESH_TOKEN_SECRET',
        fileName: 'jwt_refresh_token_secret.key',
        awsSecretIdSuffix: 'JWTRefreshTokenSecret',
        weakDefault: WEAK_DEFAULTS.JWT_REFRESH_TOKEN_SECRET
    });
    jwtIssuer = await (0, utils_1.getOrCreateStoredSecret)({
        envKey: 'JWT_ISSUER',
        fileName: 'jwt_issuer.key',
        awsSecretIdSuffix: 'JWTIssuer',
        defaultValueForNew: 'accelance'
    });
    jwtAudience = await (0, utils_1.getOrCreateStoredSecret)({
        envKey: 'JWT_AUDIENCE',
        fileName: 'jwt_audience.key',
        awsSecretIdSuffix: 'JWTAudience',
        defaultValueForNew: 'accelance'
    });
}
function getTokenHashSecret() {
    if (tokenHashSecret === undefined)
        throw new Error(NOT_INITIALIZED);
    return tokenHashSecret;
}
function getExpressSessionSecret() {
    if (expressSessionSecret === undefined)
        throw new Error(NOT_INITIALIZED);
    return expressSessionSecret;
}
function getJWTAuthTokenSecret() {
    if (jwtAuthTokenSecret === undefined)
        throw new Error(NOT_INITIALIZED);
    return jwtAuthTokenSecret;
}
function getJWTRefreshTokenSecret() {
    if (jwtRefreshTokenSecret === undefined)
        throw new Error(NOT_INITIALIZED);
    return jwtRefreshTokenSecret;
}
function getJWTIssuer() {
    if (jwtIssuer === undefined)
        throw new Error(NOT_INITIALIZED);
    return jwtIssuer;
}
function getJWTAudience() {
    if (jwtAudience === undefined)
        throw new Error(NOT_INITIALIZED);
    return jwtAudience;
}
//# sourceMappingURL=authSecrets.js.map