"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const apikey_1 = __importDefault(require("../../controllers/apikey"));
const PermissionCheck_1 = require("../../enterprise/rbac/PermissionCheck");
const router = express_1.default.Router();
// CREATE
router.post('/', (0, PermissionCheck_1.checkPermission)('apikeys:create'), apikey_1.default.createApiKey);
// READ
router.get('/', (0, PermissionCheck_1.checkPermission)('apikeys:view'), apikey_1.default.getAllApiKeys);
// UPDATE
router.put(['/', '/:id'], (0, PermissionCheck_1.checkAnyPermission)('apikeys:create,apikeys:update'), apikey_1.default.updateApiKey);
// DELETE
router.delete(['/', '/:id'], (0, PermissionCheck_1.checkPermission)('apikeys:delete'), apikey_1.default.deleteApiKey);
exports.default = router;
//# sourceMappingURL=index.js.map