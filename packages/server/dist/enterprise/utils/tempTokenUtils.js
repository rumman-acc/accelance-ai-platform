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
exports.TokenType = exports.isTokenValid = exports.getUserUUIDFromToken = exports.decryptToken = exports.encryptToken = exports.generateTempToken = exports.generateSafeCopy = void 0;
const crypto = __importStar(require("crypto"));
const moment_1 = __importDefault(require("moment"));
const nanoid_1 = require("nanoid");
const authSecrets_1 = require("./authSecrets");
const nanoid = (0, nanoid_1.customAlphabet)('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 64);
// Generate a copy of the users without their passwords.
const generateSafeCopy = (user, deleteEmail) => {
    let _user = { ...user };
    delete _user.credential;
    delete _user.tempToken;
    delete _user.tokenExpiry;
    if (deleteEmail) {
        delete _user.email;
    }
    delete _user.workspaceIds;
    delete _user.ssoToken;
    delete _user.ssoRefreshToken;
    return _user;
};
exports.generateSafeCopy = generateSafeCopy;
const generateTempToken = () => {
    // generate a token with nanoid and return it
    const token = nanoid();
    return token;
};
exports.generateTempToken = generateTempToken;
// Encrypt token with password using crypto.Cipheriv
const encryptToken = (stringToEncrypt) => {
    const key = crypto.createHash('sha256').update((0, authSecrets_1.getTokenHashSecret)()).digest();
    const IV_LENGTH = 16;
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    const encrypted = cipher.update(stringToEncrypt);
    const result = Buffer.concat([encrypted, cipher.final()]);
    // formatted string [iv]:[token]
    return iv.toString('hex') + ':' + result.toString('hex');
};
exports.encryptToken = encryptToken;
// Decrypt token using the inverse of encryption crypto algorithm
const decryptToken = (stringToDecrypt) => {
    try {
        const key = crypto.createHash('sha256').update((0, authSecrets_1.getTokenHashSecret)()).digest();
        let textParts = stringToDecrypt.split(':');
        let iv = Buffer.from(textParts.shift(), 'hex');
        let encryptedText = Buffer.from(textParts.join(':'), 'hex');
        let decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        let decrypted = decipher.update(encryptedText);
        const result = Buffer.concat([decrypted, decipher.final()]);
        return result.toString();
    }
    catch (error) {
        return undefined;
    }
};
exports.decryptToken = decryptToken;
// Extract userUUID from decrypted token string
const getUserUUIDFromToken = (token) => {
    try {
        const userUUIDHash = token.split('-')[2];
        return Buffer.from(userUUIDHash, 'base64').toString('ascii');
    }
    catch (error) {
        return undefined;
    }
};
exports.getUserUUIDFromToken = getUserUUIDFromToken;
const isTokenValid = (tokenExpiry, tokenType) => {
    // Using moment.diff method for retrieve dates difference in hours
    const tokenTimestampDate = (0, moment_1.default)(tokenExpiry);
    const now = (0, moment_1.default)();
    if (tokenType === TokenType.INVITE) {
        const expiryInHours = process.env.INVITE_TOKEN_EXPIRY_IN_HOURS ? parseInt(process.env.INVITE_TOKEN_EXPIRY_IN_HOURS) : 24;
        // Fail if more than 24 hours
        const diff = now.diff(tokenTimestampDate, 'hours');
        if (Math.abs(diff) > expiryInHours)
            return false;
    }
    else if (tokenType === TokenType.PASSWORD_RESET) {
        const expiryInMins = process.env.PASSWORD_RESET_TOKEN_EXPIRY_IN_MINUTES
            ? parseInt(process.env.PASSWORD_RESET_TOKEN_EXPIRY_IN_MINUTES)
            : 15;
        const diff = now.diff(tokenTimestampDate, 'minutes');
        if (Math.abs(diff) > expiryInMins)
            return false;
    }
    return true;
};
exports.isTokenValid = isTokenValid;
var TokenType;
(function (TokenType) {
    TokenType["INVITE"] = "INVITE";
    TokenType["PASSWORD_RESET"] = "PASSWORD_RESET";
})(TokenType || (exports.TokenType = TokenType = {}));
//# sourceMappingURL=tempTokenUtils.js.map