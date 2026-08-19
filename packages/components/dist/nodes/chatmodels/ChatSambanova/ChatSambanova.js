"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const openai_1 = require("@langchain/openai");
const utils_1 = require("../../../src/utils");
class ChatSambanova_ChatModels {
    constructor() {
        this.label = 'SambaNova';
        this.name = 'chatSambanova';
        this.version = 1.0;
        this.type = 'ChatSambanova';
        this.icon = 'sambanova.png';
        this.category = 'Chat Models';
        this.description = 'Wrapper around Sambanova Chat Endpoints';
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(openai_1.ChatOpenAI)];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['sambanovaApi']
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
                default: 'Llama-4-Maverick-17B-128E-Instruct',
                placeholder: 'Llama-4-Maverick-17B-128E-Instruct'
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
            },
            {
                label: 'Base Path',
                name: 'basepath',
                type: 'string',
                optional: true,
                default: 'https://api.sambanova.ai/v1',
                description: 'Override the default base URL for the API, e.g., "https://api.example.com/v2/',
                additionalParams: true
            },
            {
                label: 'Base Options',
                name: 'baseOptions',
                type: 'json',
                optional: true,
                description: 'Default headers to include with every request to the API.',
                additionalParams: true
            }
        ];
    }
    async init(nodeData, _, options) {
        const cache = nodeData.inputs?.cache;
        const temperature = nodeData.inputs?.temperature;
        const modelName = nodeData.inputs?.modelName;
        const streaming = nodeData.inputs?.streaming;
        const basePath = nodeData.inputs?.basepath;
        const baseOptions = nodeData.inputs?.baseOptions;
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
        const sambanovaApiKey = (0, utils_1.getCredentialParam)('sambanovaApiKey', credentialData, nodeData);
        const obj = {
            temperature: temperature ? parseFloat(temperature) : undefined,
            model: modelName,
            apiKey: sambanovaApiKey,
            openAIApiKey: sambanovaApiKey,
            streaming: streaming ?? true
        };
        if (cache)
            obj.cache = cache;
        let parsedBaseOptions = undefined;
        if (baseOptions) {
            try {
                parsedBaseOptions = typeof baseOptions === 'object' ? baseOptions : JSON.parse(baseOptions);
            }
            catch (exception) {
                throw new Error("Invalid JSON in the ChatSambanova's BaseOptions: " + exception);
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
module.exports = { nodeClass: ChatSambanova_ChatModels };
//# sourceMappingURL=ChatSambanova.js.map