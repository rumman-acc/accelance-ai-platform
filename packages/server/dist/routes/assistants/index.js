"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const assistants_1 = __importDefault(require("../../controllers/assistants"));
const PermissionCheck_1 = require("../../enterprise/rbac/PermissionCheck");
const router = express_1.default.Router();
// CREATE
router.post('/', (0, PermissionCheck_1.checkPermission)('assistants:create'), assistants_1.default.createAssistant);
// READ
router.get('/', (0, PermissionCheck_1.checkPermission)('assistants:view'), assistants_1.default.getAllAssistants);
router.get(['/', '/:id'], (0, PermissionCheck_1.checkPermission)('assistants:view'), assistants_1.default.getAssistantById);
// UPDATE
router.put(['/', '/:id'], (0, PermissionCheck_1.checkAnyPermission)('assistants:create,assistants:update'), assistants_1.default.updateAssistant);
// DELETE
router.delete(['/', '/:id'], (0, PermissionCheck_1.checkPermission)('assistants:delete'), assistants_1.default.deleteAssistant);
router.get('/components/chatmodels', assistants_1.default.getChatModels);
router.get('/components/docstores', assistants_1.default.getDocumentStores);
router.get('/components/tools', assistants_1.default.getTools);
// Generate Assistant Instruction
router.post('/generate/instruction', assistants_1.default.generateAssistantInstruction);
exports.default = router;
//# sourceMappingURL=index.js.map