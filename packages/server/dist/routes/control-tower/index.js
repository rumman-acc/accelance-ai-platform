"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const control_tower_1 = __importDefault(require("../../controllers/control-tower"));
const PermissionCheck_1 = require("../../enterprise/rbac/PermissionCheck");
const router = express_1.default.Router();
// Reuses the existing executions:view permission — Control Tower is a
// dashboard over the same execution data, not a distinct resource.
router.get('/stats', (0, PermissionCheck_1.checkAnyPermission)('executions:view'), control_tower_1.default.getStats);
router.get('/agent-ids', (0, PermissionCheck_1.checkAnyPermission)('executions:view'), control_tower_1.default.getAgentIds);
exports.default = router;
//# sourceMappingURL=index.js.map