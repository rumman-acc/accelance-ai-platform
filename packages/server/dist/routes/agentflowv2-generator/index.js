"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const agentflowv2_generator_1 = __importDefault(require("../../controllers/agentflowv2-generator"));
const router = express_1.default.Router();
router.post('/generate', agentflowv2_generator_1.default.generateAgentflowv2);
exports.default = router;
//# sourceMappingURL=index.js.map