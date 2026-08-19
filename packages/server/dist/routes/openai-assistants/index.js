"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const openai_assistants_1 = __importDefault(require("../../controllers/openai-assistants"));
const PermissionCheck_1 = require("../../enterprise/rbac/PermissionCheck");
const router = express_1.default.Router();
// CREATE
// READ
router.get('/', (0, PermissionCheck_1.checkPermission)('assistants:view'), openai_assistants_1.default.getAllOpenaiAssistants);
router.get(['/', '/:id'], (0, PermissionCheck_1.checkPermission)('assistants:view'), openai_assistants_1.default.getSingleOpenaiAssistant);
// UPDATE
// DELETE
exports.default = router;
//# sourceMappingURL=index.js.map