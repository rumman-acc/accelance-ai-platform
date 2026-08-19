"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const organization_user_controller_1 = require("../controllers/organization-user.controller");
const PermissionCheck_1 = require("../rbac/PermissionCheck");
const IdentityManager_1 = require("../../IdentityManager");
const router = express_1.default.Router();
const organizationUserController = new organization_user_controller_1.OrganizationUserController();
router.get('/', organizationUserController.read);
router.post('/', IdentityManager_1.IdentityManager.checkFeatureByPlan('feat:users'), (0, PermissionCheck_1.checkPermission)('users:manage'), organizationUserController.create);
router.put('/', IdentityManager_1.IdentityManager.checkFeatureByPlan('feat:users'), (0, PermissionCheck_1.checkPermission)('users:manage'), organizationUserController.update);
router.delete('/', IdentityManager_1.IdentityManager.checkFeatureByPlan('feat:users'), (0, PermissionCheck_1.checkPermission)('users:manage'), organizationUserController.delete);
exports.default = router;
//# sourceMappingURL=organization-user.route.js.map