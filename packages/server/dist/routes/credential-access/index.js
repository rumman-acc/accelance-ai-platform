"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const credential_access_1 = __importDefault(require("../../controllers/credential-access"));
const PermissionCheck_1 = require("../../enterprise/rbac/PermissionCheck");
const router = express_1.default.Router();
router.get('/:credentialId', (0, PermissionCheck_1.checkPermission)('credentials:manage-access'), credential_access_1.default.listAccess);
router.post('/:credentialId', (0, PermissionCheck_1.checkPermission)('credentials:manage-access'), credential_access_1.default.grantAccess);
router.delete('/:credentialId/:userId', (0, PermissionCheck_1.checkPermission)('credentials:manage-access'), credential_access_1.default.revokeAccess);
exports.default = router;
//# sourceMappingURL=index.js.map