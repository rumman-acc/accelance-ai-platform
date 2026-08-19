"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AzureChatOpenAI = void 0;
const openai_1 = require("@langchain/openai");
class AzureChatOpenAI extends openai_1.AzureChatOpenAI {
    constructor(id, fields) {
        super(fields);
        this.builtInTools = [];
        this.id = id;
        this.configuredModel = fields?.modelName ?? '';
        this.configuredMaxToken = fields?.maxTokens;
    }
    setMultiModalOption(multiModalOption) {
        this.multiModalOption = multiModalOption;
    }
    addBuiltInTools(builtInTool) {
        this.builtInTools.push(builtInTool);
    }
}
exports.AzureChatOpenAI = AzureChatOpenAI;
//# sourceMappingURL=FlowiseAzureChatOpenAI.js.map