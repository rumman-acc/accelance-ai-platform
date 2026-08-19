'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const openai_1 = require('@langchain/openai')
const utils_1 = require('../../../src/utils')
const modelLoader_1 = require('../../../src/modelLoader')
class ChatMoonshot_ChatModels {
    constructor() {
        this.baseURL = 'https://api.moonshot.ai/v1'
        //@ts-ignore
        this.loadMethods = {
            async listModels() {
                return await (0, modelLoader_1.getModels)(modelLoader_1.MODEL_TYPE.CHAT, 'chatMoonshot')
            }
        }
        this.label = 'Moonshot AI (Kimi)'
        this.name = 'chatMoonshot'
        this.version = 1.0
        this.type = 'ChatMoonshot'
        this.icon = 'moonshot.svg'
        this.category = 'Chat Models'
        this.description = 'Wrapper around Moonshot AI (Kimi) large language models that use an OpenAI-compatible Chat endpoint'
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(openai_1.ChatOpenAI)]
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['moonshotApi']
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
                type: 'asyncOptions',
                loadMethod: 'listModels',
                default: 'kimi-k2.5'
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
                label: 'Base Options',
                name: 'baseOptions',
                type: 'json',
                optional: true,
                additionalParams: true,
                description: 'Additional headers to pass to the Moonshot AI client. This should be a JSON object.'
            }
        ]
    }
    async init(nodeData, _, options) {
        const temperature = nodeData.inputs?.temperature
        const modelName = nodeData.inputs?.modelName
        const maxTokens = nodeData.inputs?.maxTokens
        const topP = nodeData.inputs?.topP
        const streaming = nodeData.inputs?.streaming
        const baseOptions = nodeData.inputs?.baseOptions
        const cache = nodeData.inputs?.cache
        if (nodeData.inputs?.credentialId) {
            nodeData.credential = nodeData.inputs?.credentialId
        }
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options)
        const moonshotApiKey = (0, utils_1.getCredentialParam)('moonshotApiKey', credentialData, nodeData)
        if (!moonshotApiKey) {
            throw new Error('Moonshot AI API Key missing from credential')
        }
        const obj = {
            temperature: temperature ? parseFloat(temperature) : undefined,
            modelName,
            openAIApiKey: moonshotApiKey,
            apiKey: moonshotApiKey,
            streaming: streaming ?? true
        }
        if (maxTokens) obj.maxTokens = parseInt(maxTokens, 10)
        if (topP) obj.topP = parseFloat(topP)
        if (cache) obj.cache = cache
        let parsedBaseOptions = undefined
        if (baseOptions) {
            try {
                parsedBaseOptions = typeof baseOptions === 'object' ? baseOptions : JSON.parse(baseOptions)
            } catch (exception) {
                throw new Error('Invalid JSON in the ChatMoonshot BaseOptions: ' + exception)
            }
        }
        const model = new openai_1.ChatOpenAI({
            ...obj,
            configuration: {
                baseURL: this.baseURL,
                defaultHeaders: parsedBaseOptions
            }
        })
        return model
    }
}
module.exports = { nodeClass: ChatMoonshot_ChatModels }
//# sourceMappingURL=ChatMoonshot.js.map
