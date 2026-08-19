"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const openai_assistants_vector_store_1 = __importDefault(require("../../controllers/openai-assistants-vector-store"));
const utils_1 = require("../../utils");
const PermissionCheck_1 = require("../../enterprise/rbac/PermissionCheck");
const router = express_1.default.Router();
// CREATE
router.post('/', (0, PermissionCheck_1.checkPermission)('assistants:create'), openai_assistants_vector_store_1.default.createAssistantVectorStore);
// READ
router.get('/:id', (0, PermissionCheck_1.checkPermission)('assistants:view'), openai_assistants_vector_store_1.default.getAssistantVectorStore);
// LIST
router.get('/', (0, PermissionCheck_1.checkPermission)('assistants:view'), openai_assistants_vector_store_1.default.listAssistantVectorStore);
// UPDATE
router.put(['/', '/:id'], (0, PermissionCheck_1.checkAnyPermission)('assistants:create,assistants:update'), openai_assistants_vector_store_1.default.updateAssistantVectorStore);
// DELETE
router.delete(['/', '/:id'], (0, PermissionCheck_1.checkPermission)('assistants:delete'), openai_assistants_vector_store_1.default.deleteAssistantVectorStore);
// UPLOAD FILES — permission check must precede multer to reject unauthorized requests before file parsing
router.post('/:id', (0, PermissionCheck_1.checkAnyPermission)('assistants:create,assistants:update'), (0, utils_1.getMulterStorage)().array('files'), openai_assistants_vector_store_1.default.uploadFilesToAssistantVectorStore);
// DELETE FILES
router.patch(['/', '/:id'], (0, PermissionCheck_1.checkPermission)('assistants:update'), openai_assistants_vector_store_1.default.deleteFilesFromAssistantVectorStore);
exports.default = router;
//# sourceMappingURL=index.js.map