"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const custom_mcp_servers_1 = __importDefault(require("../../controllers/custom-mcp-servers"));
const PermissionCheck_1 = require("../../enterprise/rbac/PermissionCheck");
const router = express_1.default.Router();
// CREATE
router.post('/', (0, PermissionCheck_1.checkPermission)('tools:create'), custom_mcp_servers_1.default.createCustomMcpServer);
// READ
router.get('/', (0, PermissionCheck_1.checkPermission)('tools:view'), custom_mcp_servers_1.default.getAllCustomMcpServers);
router.get('/:id', (0, PermissionCheck_1.checkPermission)('tools:view'), custom_mcp_servers_1.default.getCustomMcpServerById);
router.get('/:id/tools', (0, PermissionCheck_1.checkPermission)('tools:view'), custom_mcp_servers_1.default.getDiscoveredTools);
// UPDATE
router.put('/:id', (0, PermissionCheck_1.checkAnyPermission)('tools:update,tools:create'), custom_mcp_servers_1.default.updateCustomMcpServer);
// AUTHORIZE (connect to server & discover tools)
router.post('/:id/authorize', (0, PermissionCheck_1.checkAnyPermission)('tools:update,tools:create'), custom_mcp_servers_1.default.authorizeCustomMcpServer);
// DELETE
router.delete('/:id', (0, PermissionCheck_1.checkPermission)('tools:delete'), custom_mcp_servers_1.default.deleteCustomMcpServer);
exports.default = router;
//# sourceMappingURL=index.js.map