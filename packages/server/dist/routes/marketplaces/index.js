"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const marketplaces_1 = __importDefault(require("../../controllers/marketplaces"));
const PermissionCheck_1 = require("../../enterprise/rbac/PermissionCheck");
const router = express_1.default.Router();
// READ
router.get('/templates', (0, PermissionCheck_1.checkPermission)('templates:marketplace'), marketplaces_1.default.getAllTemplates);
router.post('/custom', (0, PermissionCheck_1.checkAnyPermission)('templates:flowexport,templates:toolexport'), marketplaces_1.default.saveCustomTemplate);
// READ
router.get('/custom', (0, PermissionCheck_1.checkPermission)('templates:custom'), marketplaces_1.default.getAllCustomTemplates);
// DELETE
router.delete(['/', '/custom/:id'], (0, PermissionCheck_1.checkPermission)('templates:custom-delete'), marketplaces_1.default.deleteCustomTemplate);
exports.default = router;
//# sourceMappingURL=index.js.map