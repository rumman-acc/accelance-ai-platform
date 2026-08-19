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
exports.canvasBootstrap = canvasBootstrap;
const fs_1 = require("fs");
const jwt = __importStar(require("jsonwebtoken"));
// Reads __ctkn query param or existing accel_ctx cookie, then serves index.html
// with a localStorage bootstrap script injected so the Flowise SPA bypasses RequireAuth.
function canvasBootstrap(req, res, uiHtmlPath) {
    const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
    let workspaceId = '';
    let tenantId = '';
    let userId = '';
    let role = 'MEMBER';
    const ctkn = req.query.__ctkn;
    if (ctkn) {
        try {
            const payload = jwt.verify(ctkn, JWT_SECRET);
            if (payload.type !== 'canvas')
                throw new Error('wrong token type');
            workspaceId = payload.workspaceId;
            tenantId = payload.tenantId;
            userId = payload.userId;
            role = payload.role;
            // Persist context in a cookie so subsequent SPA API calls include it
            const ctx = Buffer.from(JSON.stringify({ workspaceId, tenantId, userId, role })).toString('base64');
            res.cookie('accel_ctx', ctx, {
                httpOnly: true,
                sameSite: 'lax',
                maxAge: 60 * 60 * 1000 // 1 hour
            });
        }
        catch {
            return res.status(401).json({ error: 'Invalid or expired canvas token' });
        }
    }
    else if (req.cookies?.accel_ctx) {
        // Already bootstrapped — read from cookie
        try {
            const ctx = JSON.parse(Buffer.from(req.cookies.accel_ctx, 'base64').toString('utf8'));
            workspaceId = ctx.workspaceId;
            tenantId = ctx.tenantId;
            userId = ctx.userId;
            role = ctx.role;
        }
        catch {
            return res.status(401).json({ error: 'Invalid canvas session' });
        }
    }
    else {
        return res.status(401).json({ error: 'Canvas access requires a valid canvas token' });
    }
    const html = (0, fs_1.readFileSync)(uiHtmlPath, 'utf8');
    // Safely JSON-encode the user object for injection into the script tag
    const userObj = JSON.stringify({
        id: userId,
        email: '',
        name: 'User',
        status: 'ACTIVE',
        role,
        isSSO: false,
        activeOrganizationId: tenantId,
        activeOrganizationSubscriptionId: '',
        activeOrganizationCustomerId: '',
        activeOrganizationProductId: '',
        activeWorkspaceId: workspaceId,
        activeWorkspace: '',
        lastLogin: null,
        isOrganizationAdmin: true,
        assignedWorkspaces: [],
        permissions: ['*']
    });
    // Escape </script> sequences to avoid breaking the script tag
    const safeUserObj = userObj.replace(/<\/script>/gi, '<\\/script>');
    const bootstrapScript = `<script id="__accel_bootstrap__">
;(function(){
  var u = ${safeUserObj};
  localStorage.setItem("user", JSON.stringify(u));
  localStorage.setItem("isAuthenticated", "true");
  localStorage.setItem("isGlobal", "true");
  localStorage.setItem("permissions", JSON.stringify(["*"]));
  localStorage.setItem("features", JSON.stringify({}));
})();
</script>`;
    const injected = html.replace('</head>', `${bootstrapScript}\n</head>`);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, no-cache');
    res.send(injected);
}
//# sourceMappingURL=canvasBootstrap.js.map