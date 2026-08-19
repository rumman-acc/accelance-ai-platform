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
exports.trustEngineHeaders = void 0;
const jwt = __importStar(require("jsonwebtoken"));
const middleware_1 = require("../accelance/middleware");
// Used when ACCELANCE_ENGINE_MODE=true.
// Reads JWT directly from Authorization header or token cookie (no NestJS proxy needed).
// Falls back to accel_ctx cookie for browser canvas iframe sessions (set by canvasBootstrap).
const trustEngineHeaders = (req, res, next) => {
    const token = (0, middleware_1.extractToken)(req);
    if (token) {
        try {
            const payload = jwt.verify(token, (0, middleware_1.getJwtSecret)());
            req.user = buildFlowiseUser(payload.sub, payload.email, payload.tenantId, payload.workspaceId, payload.role);
            return next();
        }
        catch {
            // invalid token — fall through to cookie check
        }
    }
    // Fallback: accel_ctx cookie set by canvasBootstrap for iframe canvas sessions
    if (req.cookies?.accel_ctx) {
        try {
            const ctx = JSON.parse(Buffer.from(req.cookies.accel_ctx, 'base64').toString('utf8'));
            req.user = buildFlowiseUser(ctx.userId || '', '', ctx.tenantId, ctx.workspaceId, ctx.role || '');
            return next();
        }
        catch {
            // malformed cookie — fall through to 401
        }
    }
    return res.status(401).json({ error: 'Unauthorized' });
};
exports.trustEngineHeaders = trustEngineHeaders;
function buildFlowiseUser(id, email, tenantId, workspaceId, roleId) {
    return {
        id,
        email,
        name: '',
        roleId,
        activeOrganizationId: tenantId,
        activeOrganizationSubscriptionId: '',
        activeOrganizationCustomerId: '',
        activeOrganizationProductId: '',
        isOrganizationAdmin: true,
        activeWorkspaceId: workspaceId,
        activeWorkspace: '',
        assignedWorkspaces: [],
        permissions: ['*'],
        features: {}
    };
}
//# sourceMappingURL=trustEngineHeaders.js.map