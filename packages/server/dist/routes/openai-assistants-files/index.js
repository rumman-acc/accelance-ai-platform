"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const openai_assistants_1 = __importDefault(require("../../controllers/openai-assistants"));
const utils_1 = require("../../utils");
const router = express_1.default.Router();
router.post('/download/', openai_assistants_1.default.getFileFromAssistant);
router.post('/upload/', (0, utils_1.getMulterStorage)().array('files'), openai_assistants_1.default.uploadAssistantFiles);
exports.default = router;
//# sourceMappingURL=index.js.map