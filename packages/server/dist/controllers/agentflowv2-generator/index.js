"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const agentflowv2_generator_1 = __importDefault(require("../../services/agentflowv2-generator"));
const generateAgentflowv2 = async (req, res, next) => {
    try {
        if (!req.body.question || !req.body.selectedChatModel) {
            throw new Error('Question and selectedChatModel are required');
        }
        const apiResponse = await agentflowv2_generator_1.default.generateAgentflowv2(req.body.question, req.body.selectedChatModel);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
exports.default = {
    generateAgentflowv2
};
//# sourceMappingURL=index.js.map