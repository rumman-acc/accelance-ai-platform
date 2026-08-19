"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const variables_1 = __importDefault(require("../../controllers/variables"));
const PermissionCheck_1 = require("../../enterprise/rbac/PermissionCheck");
const router = express_1.default.Router();
// CREATE
router.post('/', (0, PermissionCheck_1.checkPermission)('variables:create'), variables_1.default.createVariable);
// READ
router.get('/', (0, PermissionCheck_1.checkPermission)('variables:view'), variables_1.default.getAllVariables);
// UPDATE
router.put(['/', '/:id'], (0, PermissionCheck_1.checkAnyPermission)('variables:create,variables:update'), variables_1.default.updateVariable);
// DELETE
router.delete(['/', '/:id'], (0, PermissionCheck_1.checkPermission)('variables:delete'), variables_1.default.deleteVariable);
exports.default = router;
//# sourceMappingURL=index.js.map