"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const deepseek_1 = require("@langchain/deepseek");
const modelLoader_1 = require("../../../src/modelLoader");
const utils_1 = require("../../../src/utils");
class Deepseek_ChatModels {
    constructor() {
        //@ts-ignore
        this.loadMethods = {
            async listModels() {
                return await (0, modelLoader_1.getModels)(modelLoader_1.MODEL_TYPE.CHAT, 'deepseek');
            }
        };
        this.label = 'Deepseek';
        this.name = 'chatDeepseek';
        this.version = 1.0;
        this.type = 'chatDeepseek';
        this.icon = 'deepseek.svg';
        this.category = 'Chat Models';
        this.description = 'Wrapper around Deepseek large language models that use the Chat endpoint';
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(deepseek_1.ChatDeepSeek)];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['deepseekApi']
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
                type: 'asyncOptions',
                loadMethod: 'listModels',
                default: 'deepseek-chat'
            },
            {
                label: 'Temperature',
                name: 'temperature',
                type: 'number',
                step: 0.1,
                default: 0.7,
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
                label: 'Stop Sequence',
                name: 'stopSequence',
                type: 'string',
                rows: 4,
                optional: true,
                description: 'List of stop words to use when generating. Use comma to separate multiple stop words.',
                additionalParams: true
            },
            {
                label: 'Thinking',
                name: 'thinking',
                type: 'boolean',
                default: false,
                optional: true,
                additionalParams: true,
                description: 'Enable deep thinking mode for complex reasoning tasks. When enabled, the model will use extended thinking before responding.'
            },
            {
                label: 'Base Options',
                name: 'baseOptions',
                type: 'json',
                optional: true,
                additionalParams: true,
                description: 'Additional options to pass to the Deepseek client. This should be a JSON object.'
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
        const stopSequence = nodeData.inputs?.stopSequence;
        const streaming = nodeData.inputs?.streaming;
        const thinking = nodeData.inputs?.thinking;
        const baseOptions = nodeData.inputs?.baseOptions;
        if (nodeData.inputs?.credentialId) {
            nodeData.credential = nodeData.inputs?.credentialId;
        }
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
        const openAIApiKey = (0, utils_1.getCredentialParam)('deepseekApiKey', credentialData, nodeData);
        const cache = nodeData.inputs?.cache;
        const obj = {
            temperature: parseFloat(temperature),
            modelName,
            openAIApiKey,
            apiKey: openAIApiKey,
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
        if (stopSequence) {
            const stopSequenceArray = stopSequence.split(',').map((item) => item.trim());
            obj.stop = stopSequenceArray;
        }
        if (thinking) {
            obj.modelKwargs = {
                ...obj.modelKwargs,
                thinking: { type: 'enabled' }
            };
        }
        if (baseOptions) {
            try {
                const parsedBaseOptions = typeof baseOptions === 'object' ? baseOptions : JSON.parse(baseOptions);
                obj.configuration = {
                    defaultHeaders: parsedBaseOptions
                };
            }
            catch (exception) {
                throw new Error('Invalid JSON in the BaseOptions: ' + exception);
            }
        }
        const model = new deepseek_1.ChatDeepSeek(obj);
        return model;
    }
}
module.exports = { nodeClass: Deepseek_ChatModels };
//# sourceMappingURL=Deepseek.js.map