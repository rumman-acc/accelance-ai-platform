"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatPerplexity = void 0;
const perplexity_1 = require("@langchain/community/chat_models/perplexity");
// Extend the Langchain ChatPerplexity class to include Flowise-specific properties and methods
class ChatPerplexity extends perplexity_1.ChatPerplexity {
    constructor(id, fields) {
        super(fields);
        this.id = id;
        this.configuredModel = fields?.model ?? ''; // Use model from fields
        this.configuredMaxToken = fields?.maxTokens;
    }
    // Method to set multimodal options
    setMultiModalOption(multiModalOption) {
        this.multiModalOption = multiModalOption;
    }
}
exports.ChatPerplexity = ChatPerplexity;
//# sourceMappingURL=FlowiseChatPerplexity.js.map