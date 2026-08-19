"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EMAIL_CHANGE_JWT_TYP = void 0;
exports.signEmailChangeJwt = signEmailChangeJwt;
exports.verifyEmailChangeJwt = verifyEmailChangeJwt;
exports.isEmailChangeJwtShape = isEmailChangeJwtShape;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authSecrets_1 = require("./authSecrets");
exports.EMAIL_CHANGE_JWT_TYP = 'email_change';
function signEmailChangeJwt(userId, newEmail, expiryHours) {
    const secret = (0, authSecrets_1.getJWTAuthTokenSecret)();
    const token = jsonwebtoken_1.default.sign({ typ: exports.EMAIL_CHANGE_JWT_TYP, sub: userId, newEmail }, secret, {
        expiresIn: `${expiryHours}h`
    });
    const decoded = jsonwebtoken_1.default.decode(token);
    if (!decoded?.exp)
        throw new Error('Failed to decode email change token');
    const tokenExpiry = new Date(decoded.exp * 1000);
    return { token, tokenExpiry };
}
function verifyEmailChangeJwt(token) {
    const secret = (0, authSecrets_1.getJWTAuthTokenSecret)();
    const payload = jsonwebtoken_1.default.verify(token, secret);
    if (payload.typ !== exports.EMAIL_CHANGE_JWT_TYP || typeof payload.newEmail !== 'string' || typeof payload.sub !== 'string') {
        throw new jsonwebtoken_1.default.JsonWebTokenError('Invalid email change token payload');
    }
    return { userId: payload.sub, newEmail: payload.newEmail };
}
function isEmailChangeJwtShape(token) {
    return Boolean(token && token.split('.').length === 3);
}
//# sourceMappingURL=emailChangeJwt.util.js.map