"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const tool_policy_1 = __importDefault(require("../../controllers/tool-policy"));
const PermissionCheck_1 = require("../../enterprise/rbac/PermissionCheck");
const router = express_1.default.Router();
router.get('/', (0, PermissionCheck_1.checkPermission)('tools:manage-policy'), tool_policy_1.default.listPolicies);
router.post('/', (0, PermissionCheck_1.checkPermission)('tools:manage-policy'), tool_policy_1.default.upsertPolicy);
router.delete('/:id', (0, PermissionCheck_1.checkPermission)('tools:manage-policy'), tool_policy_1.default.deletePolicy);
exports.default = router;
//# sourceMappingURL=index.js.map