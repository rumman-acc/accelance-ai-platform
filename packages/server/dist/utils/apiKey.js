"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareKeys = exports.generateSecretHash = exports.generateAPIKey = void 0;
const crypto_1 = require("crypto");
/**
 * Generate the api key
 * @returns {string}
 */
const generateAPIKey = () => {
    const buffer = (0, crypto_1.randomBytes)(32);
    return buffer.toString('base64url');
};
exports.generateAPIKey = generateAPIKey;
/**
 * Generate the secret key
 * @param {string} apiKey
 * @returns {string}
 */
const generateSecretHash = (apiKey) => {
    const salt = (0, crypto_1.randomBytes)(8).toString('hex');
    const buffer = (0, crypto_1.scryptSync)(apiKey, salt, 64);
    return `${buffer.toString('hex')}.${salt}`;
};
exports.generateSecretHash = generateSecretHash;
/**
 * Verify valid keys
 * @param {string} storedKey
 * @param {string} suppliedKey
 * @returns {boolean}
 */
const compareKeys = (storedKey, suppliedKey) => {
    const [hashedPassword, salt] = storedKey.split('.');
    const buffer = (0, crypto_1.scryptSync)(suppliedKey, salt, 64);
    return (0, crypto_1.timingSafeEqual)(Buffer.from(hashedPassword, 'hex'), buffer);
};
exports.compareKeys = compareKeys;
//# sourceMappingURL=apiKey.js.map