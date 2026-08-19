'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const modelLoader_1 = require('../../../src/modelLoader')
const utils_1 = require('../../../src/utils')
const llamaindex_1 = require('llamaindex')
class ChatMistral_LlamaIndex_ChatModels {
    constructor() {
        //@ts-ignore
        this.loadMethods = {
            async listModels() {
                return await (0, modelLoader_1.getModels)(modelLoader_1.MODEL_TYPE.CHAT, 'chatMistral_LlamaIndex')
            }
        }
        this.label = 'ChatMistral'
        this.name = 'chatMistral_LlamaIndex'
        this.version = 1.0
        this.type = 'ChatMistral'
        this.icon = 'MistralAI.svg'
        this.category = 'Chat Models'
        this.description = 'Wrapper around ChatMistral LLM specific for LlamaIndex'
        this.baseClasses = [this.type, 'BaseChatModel_LlamaIndex', ...(0, utils_1.getBaseClasses)(llamaindex_1.MistralAI)]
        this.tags = ['LlamaIndex']
        this.badge = 'DEPRECATING'
        this.deprecateMessage = 'LlamaIndex integration is deprecated and will be removed in a future release.'
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['mistralAIApi']
        }
        this.inputs = [
            {
                label: 'Model Name',
                name: 'modelName',
                type: 'asyncOptions',
                loadMethod: 'listModels',
                default: 'mistral-tiny'
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
                label: 'Max Tokens',
                name: 'maxTokensToSample',
                type: 'number',
                step: 1,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Top P',
                name: 'topP',
                type: 'number',
                step: 0.1,
                optional: true,
                additionalParams: true
            }
        ]
    }
    async init(nodeData, _, options) {
        const temperature = nodeData.inputs?.temperature
        const modelName = nodeData.inputs?.modelName
        const maxTokensToSample = nodeData.inputs?.maxTokensToSample
        const topP = nodeData.inputs?.topP
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options)
        const apiKey = (0, utils_1.getCredentialParam)('mistralAIAPIKey', credentialData, nodeData)
        const obj = {
            temperature: parseFloat(temperature),
            model: modelName,
            apiKey: apiKey
        }
        if (maxTokensToSample) obj.maxTokens = parseInt(maxTokensToSample, 10)
        if (topP) obj.topP = parseFloat(topP)
        const model = new llamaindex_1.MistralAI(obj)
        return model
    }
}
module.exports = { nodeClass: ChatMistral_LlamaIndex_ChatModels }
//# sourceMappingURL=ChatMistral_LlamaIndex.js.map
