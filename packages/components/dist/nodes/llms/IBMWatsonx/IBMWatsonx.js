"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const src_1 = require("../../../src");
const ibm_1 = require("@langchain/community/llms/ibm");
class IBMWatsonx_LLMs {
    constructor() {
        this.label = 'IBMWatsonx';
        this.name = 'ibmWatsonx';
        this.version = 1.0;
        this.type = 'IBMWatsonx';
        this.icon = 'ibm.png';
        this.category = 'LLMs';
        this.description = 'Wrapper around IBM watsonx.ai foundation models';
        this.badge = 'DEPRECATING';
        this.deprecateMessage = 'Use IBM Watsonx Chat Models instead';
        this.baseClasses = [this.type, ...(0, src_1.getBaseClasses)(ibm_1.WatsonxLLM)];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['ibmWatsonx']
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
                name: 'modelId',
                type: 'string',
                default: 'ibm/granite-13b-instruct-v2',
                description: 'The name of the model to query.'
            },
            {
                label: 'Decoding Method',
                name: 'decodingMethod',
                type: 'options',
                options: [
                    { label: 'sample', name: 'sample' },
                    { label: 'greedy', name: 'greedy' }
                ],
                default: 'greedy',
                description: 'Set decoding to Greedy to always select words with the highest probability. Set decoding to Sampling to customize the variability of word selection.',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Top K',
                name: 'topK',
                type: 'number',
                description: 'The topK parameter is used to limit the number of choices for the next predicted word or token. It specifies the maximum number of tokens to consider at each step, based on their probability of occurrence. This technique helps to speed up the generation process and can improve the quality of the generated text by focusing on the most likely options.',
                step: 1,
                default: 50,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Top P',
                name: 'topP',
                type: 'number',
                description: 'The topP (nucleus) parameter is used to dynamically adjust the number of choices for each predicted token based on the cumulative probabilities. It specifies a probability threshold, below which all less likely tokens are filtered out. This technique helps to maintain diversity and generate more fluent and natural-sounding text.',
                step: 0.1,
                default: 0.7,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Temperature',
                name: 'temperature',
                type: 'number',
                description: 'A decimal number that determines the degree of randomness in the response. A value of 1 will always yield the same output. A temperature less than 1 favors more correctness and is appropriate for question answering or summarization. A value greater than 1 introduces more randomness in the output.',
                step: 0.1,
                default: 0.7,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Repeat Penalty',
                name: 'repetitionPenalty',
                type: 'number',
                description: 'A number that controls the diversity of generated text by reducing the likelihood of repeated sequences. Higher values decrease repetition.',
                step: 0.1,
                default: 1,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Streaming',
                name: 'streaming',
                type: 'boolean',
                default: false,
                description: 'Whether or not to stream tokens as they are generated.'
            },
            {
                label: 'Max New Tokens',
                name: 'maxNewTokens',
                type: 'number',
                step: 1,
                default: 100,
                description: 'The maximum number of new tokens to be generated. The maximum supported value for this field depends on the model being used.',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Min New Tokens',
                name: 'minNewTokens',
                type: 'number',
                step: 1,
                default: 1,
                description: 'If stop sequences are given, they are ignored until minimum tokens are generated.',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Stop Sequence',
                name: 'stopSequence',
                type: 'string',
                rows: 4,
                placeholder: 'AI assistant:',
                description: 'A list of tokens at which the generation should stop.',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Include Stop Sequence',
                name: 'includeStopSequence',
                type: 'boolean',
                default: false,
                description: 'Pass false to omit matched stop sequences from the end of the output text. The default is true, meaning that the output will end with the stop sequence text when matched.',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Random Seed',
                name: 'randomSeed',
                type: 'number',
                placeholder: '62345',
                description: 'Random number generator seed to use in sampling mode for experimental repeatability.',
                optional: true,
                additionalParams: true
            }
        ];
    }
    async init(nodeData, _, options) {
        const decodingMethod = nodeData.inputs?.decodingMethod;
        const temperature = nodeData.inputs?.temperature;
        const maxNewTokens = nodeData.inputs?.maxNewTokens;
        const minNewTokens = nodeData.inputs?.minNewTokens;
        const topP = nodeData.inputs?.topP;
        const topK = nodeData.inputs?.topK;
        const repetitionPenalty = nodeData.inputs?.repetitionPenalty;
        const modelId = nodeData.inputs?.modelId;
        const stopSequence = nodeData.inputs?.stopSequence;
        const randomSeed = nodeData.inputs?.randomSeed;
        const includeStopSequence = nodeData.inputs?.includeStopSequence;
        const streaming = nodeData.inputs?.streaming;
        const cache = nodeData.inputs?.cache;
        const credentialData = await (0, src_1.getCredentialData)(nodeData.credential ?? '', options);
        const version = (0, src_1.getCredentialParam)('version', credentialData, nodeData);
        const serviceUrl = (0, src_1.getCredentialParam)('serviceUrl', credentialData, nodeData);
        const projectId = (0, src_1.getCredentialParam)('projectId', credentialData, nodeData);
        const watsonxAIAuthType = (0, src_1.getCredentialParam)('watsonxAIAuthType', credentialData, nodeData);
        const watsonxAIApikey = (0, src_1.getCredentialParam)('watsonxAIApikey', credentialData, nodeData);
        const watsonxAIBearerToken = (0, src_1.getCredentialParam)('watsonxAIBearerToken', credentialData, nodeData);
        const auth = {
            version,
            serviceUrl,
            projectId,
            watsonxAIAuthType,
            watsonxAIApikey,
            watsonxAIBearerToken
        };
        const obj = {
            ...auth,
            model: modelId,
            streaming: streaming ?? true
        };
        if (decodingMethod)
            obj.decodingMethod = decodingMethod;
        if (repetitionPenalty)
            obj.repetitionPenalty = parseFloat(repetitionPenalty);
        if (maxNewTokens)
            obj.maxNewTokens = parseInt(maxNewTokens);
        if (minNewTokens)
            obj.minNewTokens = parseInt(minNewTokens);
        if (decodingMethod === 'sample') {
            if (temperature)
                obj.temperature = parseFloat(temperature);
            if (topP)
                obj.topP = parseFloat(topP);
            if (topK)
                obj.topK = parseInt(topK);
        }
        if (stopSequence) {
            obj.stopSequence = stopSequence.split(', ') || [''];
        }
        if (randomSeed) {
            obj.randomSeed = parseInt(randomSeed);
        }
        if (includeStopSequence) {
            obj.includeStopSequence = includeStopSequence;
        }
        if (cache)
            obj.cache = cache;
        const watsonXAI = new ibm_1.WatsonxLLM(obj);
        return watsonXAI;
    }
}
module.exports = { nodeClass: IBMWatsonx_LLMs };
//# sourceMappingURL=IBMWatsonx.js.map