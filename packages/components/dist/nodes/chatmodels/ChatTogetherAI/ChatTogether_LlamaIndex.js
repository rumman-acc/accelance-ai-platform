"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../src/utils");
const llamaindex_1 = require("llamaindex");
class ChatTogetherAI_LlamaIndex_ChatModels {
    constructor() {
        this.label = 'ChatTogetherAI';
        this.name = 'chatTogetherAI_LlamaIndex';
        this.version = 1.0;
        this.type = 'ChatTogetherAI';
        this.icon = 'togetherai.png';
        this.category = 'Chat Models';
        this.description = 'Wrapper around ChatTogetherAI LLM specific for LlamaIndex';
        this.baseClasses = [this.type, 'BaseChatModel_LlamaIndex', ...(0, utils_1.getBaseClasses)(llamaindex_1.TogetherLLM)];
        this.tags = ['LlamaIndex'];
        this.badge = 'DEPRECATING';
        this.deprecateMessage = 'LlamaIndex integration is deprecated and will be removed in a future release.';
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['togetherAIApi']
        };
        this.inputs = [
            {
                label: 'Model Name',
                name: 'modelName',
                type: 'string',
                placeholder: 'mixtral-8x7b-32768',
                description: 'Refer to <a target="_blank" href="https://docs.together.ai/docs/inference-models">models</a> page'
            },
            {
                label: 'Temperature',
                name: 'temperature',
                type: 'number',
                step: 0.1,
                default: 0.9,
                optional: true
            }
        ];
    }
    async init(nodeData, _, options) {
        const temperature = nodeData.inputs?.temperature;
        const modelName = nodeData.inputs?.modelName;
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
        const togetherAIApiKey = (0, utils_1.getCredentialParam)('togetherAIApiKey', credentialData, nodeData);
        const obj = {
            temperature: parseFloat(temperature),
            model: modelName,
            apiKey: togetherAIApiKey
        };
        const model = new llamaindex_1.TogetherLLM(obj);
        return model;
    }
}
module.exports = { nodeClass: ChatTogetherAI_LlamaIndex_ChatModels };
//# sourceMappingURL=ChatTogether_LlamaIndex.js.map