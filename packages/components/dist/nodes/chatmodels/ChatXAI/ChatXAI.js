"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../src/utils");
const FlowiseChatXAI_1 = require("./FlowiseChatXAI");
class ChatXAI_ChatModels {
    constructor() {
        this.label = 'xAI Grok';
        this.name = 'chatXAI';
        this.version = 2.0;
        this.type = 'ChatXAI';
        this.icon = 'xai.png';
        this.category = 'Chat Models';
        this.description = 'Wrapper around Grok from XAI';
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(FlowiseChatXAI_1.ChatXAI)];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['xaiApi']
        };
        this.inputs = [
            {
                label: 'Cache',
                name: 'cache',
                type: 'BaseCache',
                optional: true
            },
            {
                label: 'Model',
                name: 'modelName',
                type: 'string',
                placeholder: 'grok-4'
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
                optional: true,
                additionalParams: true
            },
            {
                label: 'Allow Image Uploads',
                name: 'allowImageUploads',
                type: 'boolean',
                description: 'Allow image input. Refer to the <a href="https://docs.flowiseai.com/using-flowise/uploads#image" target="_blank">docs</a> for more details.',
                default: false,
                optional: true
            },
            {
                label: 'Max Tokens',
                name: 'maxTokens',
                type: 'number',
                step: 1,
                optional: true,
                additionalParams: true
            }
        ];
    }
    async init(nodeData, _, options) {
        const cache = nodeData.inputs?.cache;
        const temperature = nodeData.inputs?.temperature;
        const modelName = nodeData.inputs?.modelName;
        const maxTokens = nodeData.inputs?.maxTokens;
        const streaming = nodeData.inputs?.streaming;
        const allowImageUploads = nodeData.inputs?.allowImageUploads;
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
        const xaiApiKey = (0, utils_1.getCredentialParam)('xaiApiKey', credentialData, nodeData);
        const obj = {
            apiKey: xaiApiKey,
            streaming: streaming ?? true,
            model: modelName,
            temperature: temperature ? parseFloat(temperature) : undefined
        };
        if (cache)
            obj.cache = cache;
        if (maxTokens)
            obj.maxTokens = parseInt(maxTokens, 10);
        const multiModalOption = {
            image: {
                allowImageUploads: allowImageUploads ?? false
            }
        };
        const model = new FlowiseChatXAI_1.ChatXAI(nodeData.id, obj);
        model.setMultiModalOption(multiModalOption);
        return model;
    }
}
module.exports = { nodeClass: ChatXAI_ChatModels };
//# sourceMappingURL=ChatXAI.js.map