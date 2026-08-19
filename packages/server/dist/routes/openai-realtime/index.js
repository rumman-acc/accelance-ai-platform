"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const openai_realtime_1 = __importDefault(require("../../controllers/openai-realtime"));
const router = express_1.default.Router();
// GET
router.get(['/', '/:id'], openai_realtime_1.default.getAgentTools);
// EXECUTE
router.post(['/', '/:id'], openai_realtime_1.default.executeAgentTool);
exports.default = router;
//# sourceMappingURL=index.js.map