'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const groq_1 = require('@langchain/groq')
const modelLoader_1 = require('../../../src/modelLoader')
const utils_1 = require('../../../src/utils')
class Groq_ChatModels {
    constructor() {
        //@ts-ignore
        this.loadMethods = {
            async listModels() {
                return await (0, modelLoader_1.getModels)(modelLoader_1.MODEL_TYPE.CHAT, 'groqChat')
            }
        }
        this.label = 'Groq'
        this.name = 'groqChat'
        this.version = 4.0
        this.type = 'GroqChat'
        this.icon = 'groq.png'
        this.category = 'Chat Models'
        this.description = 'Wrapper around Groq API with LPU Inference Engine'
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(groq_1.ChatGroq)]
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['groqApi'],
            optional: true
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
                placeholder: 'llama3-70b-8192'
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
                name: 'maxTokens',
                type: 'number',
                step: 1,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Streaming',
                name: 'streaming',
                type: 'boolean',
                default: true,
                optional: true
            }
        ]
    }
    async init(nodeData, _, options) {
        const modelName = nodeData.inputs?.modelName
        const maxTokens = nodeData.inputs?.maxTokens
        const cache = nodeData.inputs?.cache
        const temperature = nodeData.inputs?.temperature
        const streaming = nodeData.inputs?.streaming
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options)
        const groqApiKey = (0, utils_1.getCredentialParam)('groqApiKey', credentialData, nodeData)
        const obj = {
            model: modelName,
            temperature: parseFloat(temperature),
            apiKey: groqApiKey,
            streaming: streaming ?? true
        }
        if (maxTokens) obj.maxTokens = parseInt(maxTokens, 10)
        if (cache) obj.cache = cache
        const model = new groq_1.ChatGroq(obj)
        return model
    }
}
module.exports = { nodeClass: Groq_ChatModels }
//# sourceMappingURL=Groq.js.map
