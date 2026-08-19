'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const openai_1 = require('@langchain/openai')
const utils_1 = require('../../../src/utils')
class ChatCometAPI_ChatModels {
    constructor() {
        this.baseURL = 'https://api.cometapi.com/v1'
        this.label = 'Comet'
        this.name = 'chatCometAPI'
        this.version = 1.0
        this.type = 'ChatCometAPI'
        this.icon = 'cometapi.svg'
        this.category = 'Chat Models'
        this.description = 'Wrapper around CometAPI large language models that use the Chat endpoint'
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(openai_1.ChatOpenAI)]
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['cometApi']
        }
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
                default: 'gpt-5-mini',
                description: 'Enter the model name (e.g., gpt-5-mini, claude-sonnet-4-20250514, gemini-2.0-flash)'
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
                label: 'Base Options',
                name: 'baseOptions',
                type: 'json',
                optional: true,
                additionalParams: true,
                description: 'Additional options to pass to the CometAPI client. This should be a JSON object.'
            }
        ]
    }
    async init(nodeData, _, options) {
        const temperature = nodeData.inputs?.temperature
        const modelName = nodeData.inputs?.modelName
        const maxTokens = nodeData.inputs?.maxTokens
        const topP = nodeData.inputs?.topP
        const frequencyPenalty = nodeData.inputs?.frequencyPenalty
        const presencePenalty = nodeData.inputs?.presencePenalty
        const streaming = nodeData.inputs?.streaming
        const baseOptions = nodeData.inputs?.baseOptions
        if (nodeData.inputs?.credentialId) {
            nodeData.credential = nodeData.inputs?.credentialId
        }
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options)
        const openAIApiKey = (0, utils_1.getCredentialParam)('cometApiKey', credentialData, nodeData)
        // Custom error handling for missing API key
        if (!openAIApiKey || openAIApiKey.trim() === '') {
            throw new Error(
                'CometAPI API Key is missing or empty. Please provide a valid CometAPI API key in the credential configuration.'
            )
        }
        // Custom error handling for missing model name
        if (!modelName || modelName.trim() === '') {
            throw new Error('Model Name is required. Please enter a valid model name (e.g., gpt-5-mini, claude-sonnet-4-20250514).')
        }
        const cache = nodeData.inputs?.cache
        const obj = {
            temperature: parseFloat(temperature),
            modelName,
            openAIApiKey,
            apiKey: openAIApiKey,
            streaming: streaming ?? true
        }
        if (maxTokens) obj.maxTokens = parseInt(maxTokens, 10)
        if (topP) obj.topP = parseFloat(topP)
        if (frequencyPenalty) obj.frequencyPenalty = parseFloat(frequencyPenalty)
        if (presencePenalty) obj.presencePenalty = parseFloat(presencePenalty)
        if (cache) obj.cache = cache
        let parsedBaseOptions = undefined
        if (baseOptions) {
            try {
                parsedBaseOptions = typeof baseOptions === 'object' ? baseOptions : JSON.parse(baseOptions)
                if (parsedBaseOptions.baseURL) {
                    console.warn("The 'baseURL' parameter is not allowed when using the ChatCometAPI node.")
                    parsedBaseOptions.baseURL = undefined
                }
            } catch (exception) {
                throw new Error('Invalid JSON in the BaseOptions: ' + exception)
            }
        }
        const model = new openai_1.ChatOpenAI({
            ...obj,
            configuration: {
                baseURL: this.baseURL,
                ...parsedBaseOptions
            }
        })
        return model
    }
}
module.exports = { nodeClass: ChatCometAPI_ChatModels }
//# sourceMappingURL=ChatCometAPI.js.map
