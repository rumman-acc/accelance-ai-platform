"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mcp_endpoint_1 = __importDefault(require("../../services/mcp-endpoint"));
const rateLimit_1 = require("../../utils/rateLimit");
const logger_1 = __importDefault(require("../../utils/logger"));
/**
 * Extract token from the Authorization: Bearer <token> header.
 * Returns null if not present or malformed.
 */
function extractToken(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer '))
        return null;
    const token = authHeader.slice(7).trim();
    return token.length > 0 ? token : null;
}
/**
 * Authentication middleware — validates Bearer token and attaches it to res.locals.
 */
const authenticateToken = (req, res, next) => {
    const token = extractToken(req);
    if (!token) {
        res.status(401).json({
            jsonrpc: '2.0',
            error: { code: -32001, message: 'Unauthorized: missing or invalid Authorization header. Use Bearer <token>.' },
            id: null
        });
        return;
    }
    res.locals.token = token;
    next();
};
/**
 * Rate limiter middleware for MCP endpoint — reuses per-chatflow rate limiters.
 */
const getRateLimiterMiddleware = async (req, res, next) => {
    try {
        return rateLimit_1.RateLimiterManager.getInstance().getRateLimiter()(req, res, next);
    }
    catch (error) {
        next(error);
    }
};
/**
 * Handle POST /api/mcp/:chatflowId — MCP JSON-RPC messages
 * Auth: token must be in Authorization: Bearer <token> header
 */
const handlePost = async (req, res, next) => {
    try {
        const { chatflowId } = req.params;
        const token = res.locals.token;
        logger_1.default.debug(`[MCP] POST request for chatflow: ${chatflowId}`);
        await mcp_endpoint_1.default.handleMcpRequest(chatflowId, token, req, res);
    }
    catch (error) {
        next(error);
    }
};
/**
 * Handle DELETE /api/mcp/:chatflowId — Session termination
 */
const handleDelete = async (req, res, next) => {
    try {
        const { chatflowId } = req.params;
        await mcp_endpoint_1.default.handleMcpDeleteRequest(chatflowId, req, res);
    }
    catch (error) {
        next(error);
    }
};
exports.default = {
    authenticateToken,
    handlePost,
    handleDelete,
    getRateLimiterMiddleware
};
//# sourceMappingURL=index.js.map