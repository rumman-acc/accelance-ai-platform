"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mcp_registry_1 = __importDefault(require("../../controllers/mcp-registry"));
const PermissionCheck_1 = require("../../enterprise/rbac/PermissionCheck");
const router = express_1.default.Router();
// SEARCH the public official MCP registry by keyword
router.get('/search', (0, PermissionCheck_1.checkPermission)('tools:view'), mcp_registry_1.default.searchServers);
// IMPORT a selected registry server as a CustomMcpServer row (same permission as any other tool-create action)
router.post('/import', (0, PermissionCheck_1.checkPermission)('tools:create'), mcp_registry_1.default.importServer);
exports.default = router;
//# sourceMappingURL=index.js.map