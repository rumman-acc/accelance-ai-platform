"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const src_1 = require("../../../src");
const togetherai_1 = require("@langchain/community/llms/togetherai");
const modelLoader_1 = require("../../../src/modelLoader");
class TogetherAI_LLMs {
    constructor() {
        //@ts-ignore
        this.loadMethods = {
            async listModels() {
                return await (0, modelLoader_1.getModels)(modelLoader_1.MODEL_TYPE.LLM, 'togetherAI');
            }
        };
        this.label = 'TogetherAI';
        this.name = 'togetherAI';
        this.version = 1.0;
        this.type = 'TogetherAI';
        this.icon = 'togetherai.png';
        this.category = 'LLMs';
        this.description = 'Wrapper around TogetherAI large language models';
        this.badge = 'DEPRECATING';
        this.deprecateMessage = 'Use TogetherAI Chat Models instead';
        this.baseClasses = [this.type, ...(0, src_1.getBaseClasses)(togetherai_1.TogetherAI)];
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
                description: 'The name of the model to query.'
            },
            {
                label: 'Top K',
                name: 'topK',
                type: 'number',
                description: 'The topK parameter is used to limit the number of choices for the next predicted word or token. It specifies the maximum number of tokens to consider at each step, based on their probability of occurrence. This technique helps to speed up the generation process and can improve the quality of the generated text by focusing on the most likely options.',
                step: 1,
                default: 50
            },
            {
                label: 'Top P',
                name: 'topP',
                type: 'number',
                description: 'The topP (nucleus) parameter is used to dynamically adjust the number of choices for each predicted token based on the cumulative probabilities. It specifies a probability threshold, below which all less likely tokens are filtered out. This technique helps to maintain diversity and generate more fluent and natural-sounding text.',
                step: 0.1,
                default: 0.7
            },
            {
                label: 'Temperature',
                name: 'temperature',
                type: 'number',
                description: 'A decimal number that determines the degree of randomness in the response. A value of 1 will always yield the same output. A temperature less than 1 favors more correctness and is appropriate for question answering or summarization. A value greater than 1 introduces more randomness in the output.',
                step: 0.1,
                default: 0.7
            },
            {
                label: 'Repeat Penalty',
                name: 'repeatPenalty',
                type: 'number',
                description: 'A number that controls the diversity of generated text by reducing the likelihood of repeated sequences. Higher values decrease repetition.',
                step: 0.1,
                default: 1
            },
            {
                label: 'Streaming',
                name: 'streaming',
                type: 'boolean',
                default: false,
                description: 'Whether or not to stream tokens as they are generated'
            },
            {
                label: 'Max Tokens',
                name: 'maxTokens',
                type: 'number',
                step: 1,
                description: 'Limit the number of tokens generated.',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Stop Sequence',
                name: 'stop',
                type: 'string',
                rows: 4,
                placeholder: 'AI assistant:',
                description: 'A list of tokens at which the generation should stop.',
                optional: true,
                additionalParams: true
            }
            // todo: safetyModel? logprobs?
        ];
    }
    async init(nodeData, _, options) {
        const temperature = nodeData.inputs?.temperature;
        const maxTokens = nodeData.inputs?.maxTokens;
        const topP = nodeData.inputs?.topP;
        const topK = nodeData.inputs?.topK;
        const repeatPenalty = nodeData.inputs?.repeatPenalty;
        const modelName = nodeData.inputs?.modelName;
        const stop = nodeData.inputs?.stop;
        const streaming = nodeData.inputs?.streaming;
        const cache = nodeData.inputs?.cache;
        const credentialData = await (0, src_1.getCredentialData)(nodeData.credential ?? '', options);
        const togetherAiApiKey = (0, src_1.getCredentialParam)('togetherAIApiKey', credentialData, nodeData);
        const obj = {
            modelName,
            apiKey: togetherAiApiKey,
            streaming: streaming ?? false
        };
        if (temperature)
            obj.temperature = parseFloat(temperature);
        if (maxTokens)
            obj.maxTokens = parseInt(maxTokens, 10);
        if (topP)
            obj.topP = parseFloat(topP);
        if (topK)
            obj.topK = parseFloat(topK);
        if (repeatPenalty)
            obj.repetitionPenalty = parseFloat(repeatPenalty);
        if (streaming)
            obj.streaming = streaming;
        if (stop) {
            obj.stop = stop.split(',');
        }
        if (cache)
            obj.cache = cache;
        const togetherAI = new togetherai_1.TogetherAI(obj);
        return togetherAI;
    }
}
module.exports = { nodeClass: TogetherAI_LLMs };
//# sourceMappingURL=TogetherAI.js.map