"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const webhook_listener_1 = __importDefault(require("../../controllers/webhook-listener"));
const PermissionCheck_1 = require("../../enterprise/rbac/PermissionCheck");
const router = express_1.default.Router();
const requireFlowEdit = (0, PermissionCheck_1.checkAnyPermission)('chatflows:create,chatflows:update,agentflows:create,agentflows:update');
router.post('/:id/register', requireFlowEdit, webhook_listener_1.default.registerListener);
router.get('/:id/stream/:listenerId', requireFlowEdit, webhook_listener_1.default.streamListener);
router.delete('/:id/listener/:listenerId', requireFlowEdit, webhook_listener_1.default.unregisterListener);
exports.default = router;
//# sourceMappingURL=index.js.map