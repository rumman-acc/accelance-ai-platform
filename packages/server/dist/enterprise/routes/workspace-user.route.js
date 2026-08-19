"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const workspace_user_controller_1 = require("../controllers/workspace-user.controller");
const IdentityManager_1 = require("../../IdentityManager");
const PermissionCheck_1 = require("../rbac/PermissionCheck");
const router = express_1.default.Router();
const workspaceUserController = new workspace_user_controller_1.WorkspaceUserController();
// no feature flag because user with lower plan can read invited workspaces with higher plan
router.get('/', workspaceUserController.read);
router.post('/', IdentityManager_1.IdentityManager.checkFeatureByPlan('feat:workspaces'), (0, PermissionCheck_1.checkPermission)('workspace:add-user'), workspaceUserController.create);
router.put('/', IdentityManager_1.IdentityManager.checkFeatureByPlan('feat:workspaces'), (0, PermissionCheck_1.checkPermission)('workspace:add-user'), workspaceUserController.update);
router.delete('/', IdentityManager_1.IdentityManager.checkFeatureByPlan('feat:workspaces'), (0, PermissionCheck_1.checkPermission)('workspace:unlink-user'), workspaceUserController.delete);
exports.default = router;
//# sourceMappingURL=workspace-user.route.js.map