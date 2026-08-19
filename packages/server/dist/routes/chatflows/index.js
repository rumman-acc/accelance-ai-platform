"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const chatflows_1 = __importDefault(require("../../controllers/chatflows"));
const PermissionCheck_1 = require("../../enterprise/rbac/PermissionCheck");
const router = express_1.default.Router();
// CREATE
router.post('/', (0, PermissionCheck_1.checkAnyPermission)('chatflows:create,chatflows:update,agentflows:create,agentflows:update'), chatflows_1.default.saveChatflow);
// READ
router.get('/', (0, PermissionCheck_1.checkAnyPermission)('chatflows:view,chatflows:update,agentflows:view,agentflows:update'), chatflows_1.default.getAllChatflows);
router.get(['/', '/:id'], (0, PermissionCheck_1.checkAnyPermission)('chatflows:view,chatflows:update,chatflows:delete,agentflows:view,agentflows:update,agentflows:delete'), chatflows_1.default.getChatflowById);
router.get(['/apikey/', '/apikey/:apikey'], chatflows_1.default.getChatflowByApiKey);
// UPDATE
router.put(['/', '/:id'], (0, PermissionCheck_1.checkAnyPermission)('chatflows:create,chatflows:update,agentflows:create,agentflows:update'), chatflows_1.default.updateChatflow);
// DELETE
router.delete(['/', '/:id'], (0, PermissionCheck_1.checkAnyPermission)('chatflows:delete,agentflows:delete,assistants:delete'), chatflows_1.default.deleteChatflow);
// WEBHOOK SECRET
router.post('/:id/webhook-secret', (0, PermissionCheck_1.checkAnyPermission)('chatflows:update,agentflows:update'), chatflows_1.default.setWebhookSecret);
router.delete('/:id/webhook-secret', (0, PermissionCheck_1.checkAnyPermission)('chatflows:update,agentflows:update'), chatflows_1.default.clearWebhookSecret);
// CREDENTIAL ACCESS WARNINGS (build-time, non-blocking)
router.get('/:id/credential-access-warnings', (0, PermissionCheck_1.checkAnyPermission)('chatflows:create,chatflows:update,agentflows:create,agentflows:update'), chatflows_1.default.getCredentialAccessWarnings);
// CHECK FOR CHANGE
router.get('/has-changed/:id/:lastUpdatedDateTime', (0, PermissionCheck_1.checkAnyPermission)('chatflows:update,agentflows:update'), chatflows_1.default.checkIfChatflowHasChanged);
// SCHEDULE
router.get('/:id/schedule/status', (0, PermissionCheck_1.checkAnyPermission)('chatflows:view,chatflows:update,agentflows:view,agentflows:update'), chatflows_1.default.getScheduleStatus);
router.patch('/:id/schedule/enabled', (0, PermissionCheck_1.checkAnyPermission)('chatflows:update,agentflows:update'), chatflows_1.default.toggleScheduleEnabled);
router.get('/:id/schedule/trigger-logs', (0, PermissionCheck_1.checkAnyPermission)('chatflows:view,chatflows:update,agentflows:view,agentflows:update'), chatflows_1.default.getScheduleTriggerLogs);
router.delete('/:id/schedule/trigger-logs', (0, PermissionCheck_1.checkAnyPermission)('chatflows:update,agentflows:update,executions:delete'), chatflows_1.default.deleteScheduleTriggerLogs);
exports.default = router;
//# sourceMappingURL=index.js.map