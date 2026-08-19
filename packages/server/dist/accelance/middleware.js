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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJwtSecret = getJwtSecret;
exports.extractToken = extractToken;
exports.requireAuth = requireAuth;
const jwt = __importStar(require("jsonwebtoken"));
function getJwtSecret() {
    return process.env.JWT_SECRET || 'change-me-in-production';
}
function extractToken(req) {
    const auth = req.headers['authorization'];
    if (auth?.startsWith('Bearer '))
        return auth.slice(7);
    return req.cookies?.token ?? null;
}
function requireAuth(req, res, next) {
    const token = extractToken(req);
    if (!token) {
        res.status(401).json({ statusCode: 401, message: 'Unauthorized' });
        return;
    }
    try {
        const payload = jwt.verify(token, getJwtSecret());
        req.jwtUser = payload;
        next();
    }
    catch {
        res.status(401).json({ statusCode: 401, message: 'Unauthorized' });
    }
}
//# sourceMappingURL=middleware.js.map