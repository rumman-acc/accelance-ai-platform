"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const openai_1 = require("@langchain/openai");
const utils_1 = require("../../../src/utils");
class ChatNvdiaNIM_ChatModels {
    constructor() {
        this.label = 'Nvidia NIM';
        this.name = 'chatNvidiaNIM';
        this.version = 1.1;
        this.type = 'ChatNvidiaNIM';
        this.icon = 'nvdia.svg';
        this.category = 'Chat Models';
        this.description = 'Wrapper around NVIDIA NIM Inference API';
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(openai_1.ChatOpenAI)];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['nvidiaNIMApi'],
            optional: true
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
                placeholder: 'microsoft/phi-3-mini-4k-instruct'
            },
            {
                label: 'Base Path',
                name: 'basePath',
                type: 'string',
                description: 'Specify the URL of the deployed NIM Inference API',
                placeholder: 'https://integrate.api.nvidia.com/v1'
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
                label: 'Max Tokens',
                name: 'maxTokens',
                type: 'number',
                step: 1,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Top Probability',
                name: 'topP',
                type: 'number',
                step: 0.1,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Frequency Penalty',
                name: 'frequencyPenalty',
                type: 'number',
                step: 0.1,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Presence Penalty',
                name: 'presencePenalty',
                type: 'number',
                step: 0.1,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Timeout',
                name: 'timeout',
                type: 'number',
                step: 1,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Base Options',
                name: 'baseOptions',
                type: 'json',
                optional: true,
                additionalParams: true
            }
        ];
    }
    async init(nodeData, _, options) {
        const temperature = nodeData.inputs?.temperature;
        const modelName = nodeData.inputs?.modelName;
        const maxTokens = nodeData.inputs?.maxTokens;
        const topP = nodeData.inputs?.topP;
        const frequencyPenalty = nodeData.inputs?.frequencyPenalty;
        const presencePenalty = nodeData.inputs?.presencePenalty;
        const timeout = nodeData.inputs?.timeout;
        const streaming = nodeData.inputs?.streaming;
        const basePath = nodeData.inputs?.basePath;
        const baseOptions = nodeData.inputs?.baseOptions;
        const cache = nodeData.inputs?.cache;
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
        const nvidiaNIMApiKey = (0, utils_1.getCredentialParam)('nvidiaNIMApiKey', credentialData, nodeData);
        const obj = {
            temperature: parseFloat(temperature),
            modelName,
            openAIApiKey: nvidiaNIMApiKey ?? 'sk-',
            apiKey: nvidiaNIMApiKey ?? 'sk-',
            streaming: streaming ?? true
        };
        if (maxTokens)
            obj.maxTokens = parseInt(maxTokens, 10);
        if (topP)
            obj.topP = parseFloat(topP);
        if (frequencyPenalty)
            obj.frequencyPenalty = parseFloat(frequencyPenalty);
        if (presencePenalty)
            obj.presencePenalty = parseFloat(presencePenalty);
        if (timeout)
            obj.timeout = parseInt(timeout, 10);
        if (cache)
            obj.cache = cache;
        let parsedBaseOptions = undefined;
        if (baseOptions) {
            try {
                parsedBaseOptions = typeof baseOptions === 'object' ? baseOptions : JSON.parse(baseOptions);
            }
            catch (exception) {
                throw new Error("Invalid JSON in the Chat NVIDIA NIM's baseOptions: " + exception);
            }
        }
        if (basePath || parsedBaseOptions) {
            obj.configuration = {
                baseURL: basePath,
                defaultHeaders: parsedBaseOptions
            };
        }
        const model = new openai_1.ChatOpenAI(obj);
        return model;
    }
}
module.exports = { nodeClass: ChatNvdiaNIM_ChatModels };
//# sourceMappingURL=ChatNvdiaNIM.js.map