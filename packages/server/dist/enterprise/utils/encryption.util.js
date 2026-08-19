"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPasswordSaltRounds = getPasswordSaltRounds;
exports.getBcryptRoundsFromHash = getBcryptRoundsFromHash;
exports.hashNeedsUpgrade = hashNeedsUpgrade;
exports.getHash = getHash;
exports.compareHash = compareHash;
exports.encrypt = encrypt;
exports.decrypt = decrypt;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_js_1 = require("crypto-js");
const utils_1 = require("../../utils");
function getPasswordSaltRounds() {
    return parseInt(process.env.PASSWORD_SALT_HASH_ROUNDS || '10', 10);
}
/**
 * Extracts the cost factor (salt rounds) from a bcrypt hash using bcrypt.getRounds().
 * @returns The number of rounds used, or null if the string is not a valid bcrypt hash.
 */
function getBcryptRoundsFromHash(hash) {
    try {
        return bcryptjs_1.default.getRounds(hash);
    }
    catch {
        return null;
    }
}
/**
 * Checks if a stored bcrypt hash was created with fewer rounds than the current minimum,
 * and should be rehashed for stronger security.
 * @param storedHash The bcrypt hash stored in the database.
 * @param minRounds The minimum acceptable number of salt rounds (e.g. 10).
 */
function hashNeedsUpgrade(storedHash, minRounds) {
    const rounds = getBcryptRoundsFromHash(storedHash);
    return rounds !== null && rounds < minRounds;
}
function getHash(value) {
    const salt = bcryptjs_1.default.genSaltSync(getPasswordSaltRounds());
    return bcryptjs_1.default.hashSync(value, salt);
}
function compareHash(value1, value2) {
    return bcryptjs_1.default.compareSync(value1, value2);
}
async function encrypt(value) {
    const encryptionKey = await (0, utils_1.getEncryptionKey)();
    return crypto_js_1.AES.encrypt(value, encryptionKey).toString();
}
async function decrypt(value) {
    const encryptionKey = await (0, utils_1.getEncryptionKey)();
    return crypto_js_1.AES.decrypt(value, encryptionKey).toString(crypto_js_1.enc.Utf8);
}
//# sourceMappingURL=encryption.util.js.map