"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mcp_server_1 = __importDefault(require("../../controllers/mcp-server"));
const PermissionCheck_1 = require("../../enterprise/rbac/PermissionCheck");
const router = express_1.default.Router();
// GET    /api/mcp-server/:id     → get current config
router.get('/:id', (0, PermissionCheck_1.checkAnyPermission)('chatflows:config,agentflows:config'), mcp_server_1.default.getMcpServerConfig);
// POST   /api/mcp-server/:id       → enable (generates token)
router.post('/:id', (0, PermissionCheck_1.checkAnyPermission)('chatflows:config,agentflows:config'), mcp_server_1.default.createMcpServerConfig);
// PUT    /api/mcp-server/:id         → update description/toolName/status
router.put('/:id', (0, PermissionCheck_1.checkAnyPermission)('chatflows:config,agentflows:config'), mcp_server_1.default.updateMcpServerConfig);
// DELETE /api/mcp-server/:id         → disable (set enabled=false)
router.delete('/:id', (0, PermissionCheck_1.checkAnyPermission)('chatflows:config,agentflows:config'), mcp_server_1.default.deleteMcpServerConfig);
// POST   /api/mcp-server/:id/refresh → rotate token
router.post('/:id/refresh', (0, PermissionCheck_1.checkAnyPermission)('chatflows:config,agentflows:config'), mcp_server_1.default.refreshMcpToken);
exports.default = router;
//# sourceMappingURL=index.js.map