"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chat_models_1 = require("@langchain/core/language_models/chat_models");
const NemoClient_1 = require("./NemoClient");
const src_1 = require("../../../src");
class ChatNemoGuardrailsModel extends chat_models_1.BaseChatModel {
    _llmType() {
        return 'nemo-guardrails';
    }
    _generate(messages, options, runManager) {
        const generate = async (messages, client) => {
            const chatMessages = await client.chat(messages);
            const generations = chatMessages.map((message) => {
                return {
                    text: message.content?.toString() ?? '',
                    message
                };
            });
            await runManager?.handleLLMNewToken(generations.length ? generations[0].text : '');
            return {
                generations
            };
        };
        return generate(messages, this.client);
    }
    constructor({ id, fields }) {
        super(fields);
        this.id = id;
        this.configurationId = fields.configurationId ?? '';
        this.baseUrl = fields.baseUrl ?? '';
        this.callbackManager = fields.callbackManager;
        this.maxConcurrency = fields.maxConcurrency;
        this.maxRetries = fields.maxRetries;
        this.onFailedAttempt = fields.onFailedAttempt;
        this.client = new NemoClient_1.NemoClient(this.baseUrl, this.configurationId);
    }
}
class ChatNemoGuardrailsChatModel {
    constructor() {
        this.label = 'Nemo Guardrails';
        this.name = 'chatNemoGuardrails';
        this.version = 1.0;
        this.type = 'ChatNemoGuardrails';
        this.icon = 'nemo.svg';
        this.category = 'Chat Models';
        this.description = 'Access models through the Nemo Guardrails API';
        this.baseClasses = [this.type, ...(0, src_1.getBaseClasses)(ChatNemoGuardrailsModel)];
        this.inputs = [
            {
                label: 'Configuration ID',
                name: 'configurationId',
                type: 'string',
                optional: false
            },
            {
                label: 'Base URL',
                name: 'baseUrl',
                type: 'string',
                optional: false
            }
        ];
    }
    async init(nodeData) {
        const configurationId = nodeData.inputs?.configurationId;
        const baseUrl = nodeData.inputs?.baseUrl;
        const obj = {
            configurationId: configurationId,
            baseUrl: baseUrl
        };
        const model = new ChatNemoGuardrailsModel({ id: nodeData.id, fields: obj });
        return model;
    }
}
module.exports = { nodeClass: ChatNemoGuardrailsChatModel };
//# sourceMappingURL=ChatNemoGuardrails.js.map