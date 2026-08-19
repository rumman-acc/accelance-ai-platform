"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const executions_1 = __importDefault(require("../../controllers/executions"));
const PermissionCheck_1 = require("../../enterprise/rbac/PermissionCheck");
const router = express_1.default.Router();
// READ
router.get('/', (0, PermissionCheck_1.checkAnyPermission)('executions:view'), executions_1.default.getAllExecutions);
router.get(['/', '/:id'], (0, PermissionCheck_1.checkAnyPermission)('executions:view'), executions_1.default.getExecutionById);
// PUT
router.put(['/', '/:id'], (0, PermissionCheck_1.checkAnyPermission)('executions:update'), executions_1.default.updateExecution);
// DELETE - single execution or multiple executions
router.delete('/:id', (0, PermissionCheck_1.checkAnyPermission)('executions:delete'), executions_1.default.deleteExecutions);
router.delete('/', (0, PermissionCheck_1.checkAnyPermission)('executions:delete'), executions_1.default.deleteExecutions);
exports.default = router;
//# sourceMappingURL=index.js.map