"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const credentials_1 = __importDefault(require("../../controllers/credentials"));
const PermissionCheck_1 = require("../../enterprise/rbac/PermissionCheck");
const router = express_1.default.Router();
// CREATE
router.post('/', (0, PermissionCheck_1.checkPermission)('credentials:create'), credentials_1.default.createCredential);
// READ
router.get('/', (0, PermissionCheck_1.checkPermission)('credentials:view'), credentials_1.default.getAllCredentials);
router.get(['/', '/:id'], (0, PermissionCheck_1.checkAnyPermission)('credentials:create,credentials:update'), credentials_1.default.getCredentialById);
// REVEAL
router.get('/:id/reveal', (0, PermissionCheck_1.checkAnyPermission)('credentials:create,credentials:update'), credentials_1.default.revealCredentialById);
// UPDATE
router.put(['/', '/:id'], (0, PermissionCheck_1.checkAnyPermission)('credentials:create,credentials:update'), credentials_1.default.updateCredential);
// DELETE
router.delete(['/', '/:id'], (0, PermissionCheck_1.checkPermission)('credentials:delete'), credentials_1.default.deleteCredentials);
exports.default = router;
//# sourceMappingURL=index.js.map