"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const mcp_endpoint_1 = __importDefault(require("../../controllers/mcp-endpoint"));
const router = express_1.default.Router();
// Body size limit: 1MB max for MCP JSON-RPC payloads (overrides the global 50mb limit)
router.use(express_1.default.json({ limit: '1mb', type: 'application/json' }));
// CORS: Use MCP_CORS_ORIGINS if set, otherwise allow only non-browser (no Origin header) requests.
// MCP desktop clients (Claude Desktop, Cursor, etc.) don't send an Origin header, so they pass through.
// Browser-based clients are restricted to the configured origins.
const mcpCorsOrigins = process.env.MCP_CORS_ORIGINS;
const mcpCorsOptions = {
    origin: mcpCorsOrigins
        ? mcpCorsOrigins === '*'
            ? true
            : mcpCorsOrigins.split(',').map((o) => o.trim())
        : (origin, callback) => {
            // No origin header (desktop/server-to-server) → allow
            // Browser origin → deny (no allowed list configured)
            callback(null, !origin);
        },
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400
};
router.use((0, cors_1.default)(mcpCorsOptions));
// Handle preflight for all MCP routes
router.options('/:chatflowId', (0, cors_1.default)(mcpCorsOptions));
// MCP Streamable HTTP protocol routes (protocol version 2025-03-26)
// Auth: token must be provided via Authorization: Bearer <token> header
// POST — JSON-RPC messages (initialize, tools/list, tools/call, etc.)
router.post('/:chatflowId', mcp_endpoint_1.default.getRateLimiterMiddleware, mcp_endpoint_1.default.authenticateToken, mcp_endpoint_1.default.handlePost);
// DELETE — Session termination (stateless mode returns 405)
router.delete('/:chatflowId', mcp_endpoint_1.default.handleDelete);
exports.default = router;
//# sourceMappingURL=index.js.map