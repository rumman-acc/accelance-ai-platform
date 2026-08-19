"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const tools_1 = __importDefault(require("../../controllers/tools"));
const PermissionCheck_1 = require("../../enterprise/rbac/PermissionCheck");
const router = express_1.default.Router();
// CREATE
router.post('/', (0, PermissionCheck_1.checkPermission)('tools:create'), tools_1.default.createTool);
// READ
router.get('/', (0, PermissionCheck_1.checkPermission)('tools:view'), tools_1.default.getAllTools);
router.get(['/', '/:id'], (0, PermissionCheck_1.checkAnyPermission)('tools:view'), tools_1.default.getToolById);
// UPDATE
router.put(['/', '/:id'], (0, PermissionCheck_1.checkAnyPermission)('tools:update,tools:create'), tools_1.default.updateTool);
// DELETE
router.delete(['/', '/:id'], (0, PermissionCheck_1.checkPermission)('tools:delete'), tools_1.default.deleteTool);
exports.default = router;
//# sourceMappingURL=index.js.map