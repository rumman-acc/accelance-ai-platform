"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const togetherai_1 = require("@langchain/community/chat_models/togetherai");
const utils_1 = require("../../../src/utils");
class ChatTogetherAI_ChatModels {
    constructor() {
        this.label = 'TogetherAI';
        this.name = 'chatTogetherAI';
        this.version = 2.0;
        this.type = 'ChatTogetherAI';
        this.icon = 'togetherai.png';
        this.category = 'Chat Models';
        this.description = 'Wrapper around TogetherAI large language models';
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(togetherai_1.ChatTogetherAI)];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['togetherAIApi']
        };
        this.inputs = [
            {
                label: 'Cache',
                name: 'cache',
                type: 'BaseCache',
                optional: true
            },
            {
                label: 'Model Name',
                name: 'modelName',
                type: 'string',
                placeholder: 'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8',
                description: 'Refer to <a target="_blank" href="https://docs.together.ai/docs/inference-models">models</a> page'
            },
            {
                label: 'Temperature',
                name: 'temperature',
                type: 'number',
                step: 0.1,
                default: 0.9,
                optional: true
            },
            {
                label: 'Streaming',
                name: 'streaming',
                type: 'boolean',
                default: true,
                optional: true
            }
        ];
    }
    async init(nodeData, _, options) {
        const modelName = nodeData.inputs?.modelName;
        const cache = nodeData.inputs?.cache;
        const temperature = nodeData.inputs?.temperature;
        const streaming = nodeData.inputs?.streaming;
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
        const togetherAIApiKey = (0, utils_1.getCredentialParam)('togetherAIApiKey', credentialData, nodeData);
        const obj = {
            model: modelName,
            temperature: parseFloat(temperature),
            togetherAIApiKey: togetherAIApiKey,
            streaming: streaming ?? true
        };
        if (cache)
            obj.cache = cache;
        const model = new togetherai_1.ChatTogetherAI(obj);
        return model;
    }
}
module.exports = { nodeClass: ChatTogetherAI_ChatModels };
//# sourceMappingURL=ChatTogetherAI.js.map