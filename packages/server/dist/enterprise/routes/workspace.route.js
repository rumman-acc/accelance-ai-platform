"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const workspace_controller_1 = require("../controllers/workspace.controller");
const IdentityManager_1 = require("../../IdentityManager");
const PermissionCheck_1 = require("../rbac/PermissionCheck");
const router = express_1.default.Router();
const workspaceController = new workspace_controller_1.WorkspaceController();
router.get('/', IdentityManager_1.IdentityManager.checkFeatureByPlan('feat:workspaces'), (0, PermissionCheck_1.checkPermission)('workspace:view'), workspaceController.read);
router.post('/', IdentityManager_1.IdentityManager.checkFeatureByPlan('feat:workspaces'), (0, PermissionCheck_1.checkPermission)('workspace:create'), workspaceController.create);
// no feature flag because user with lower plan can switch to invited workspaces with higher plan
router.post('/switch', workspaceController.switchWorkspace);
router.put('/', IdentityManager_1.IdentityManager.checkFeatureByPlan('feat:workspaces'), (0, PermissionCheck_1.checkPermission)('workspace:update'), workspaceController.update);
router.delete(['/', '/:id'], IdentityManager_1.IdentityManager.checkFeatureByPlan('feat:workspaces'), (0, PermissionCheck_1.checkPermission)('workspace:delete'), workspaceController.delete);
router.get(['/shared', '/shared/:id'], IdentityManager_1.IdentityManager.checkFeatureByPlan('feat:workspaces'), (0, PermissionCheck_1.checkPermission)('workspace:create'), workspaceController.getSharedWorkspacesForItem);
router.post(['/shared', '/shared/:id'], IdentityManager_1.IdentityManager.checkFeatureByPlan('feat:workspaces'), (0, PermissionCheck_1.checkPermission)('workspace:create'), workspaceController.setSharedWorkspacesForItem);
exports.default = router;
//# sourceMappingURL=workspace.route.js.map