'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const openai_1 = require('@langchain/openai')
const utils_1 = require('../../../src/utils')
const FlowiseChatOpenAI_1 = require('../ChatOpenAI/FlowiseChatOpenAI')
class ChatLitellm_ChatModels {
    constructor() {
        this.label = 'LiteLLM'
        this.name = 'chatLitellm'
        this.version = 2.0
        this.type = 'ChatLitellm'
        this.icon = 'litellm.jpg'
        this.category = 'Chat Models'
        this.description = 'Connect to a Litellm server using OpenAI-compatible API'
        this.baseClasses = [this.type, 'BaseChatModel', ...(0, utils_1.getBaseClasses)(openai_1.ChatOpenAI)]
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['litellmApi'],
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
                label: 'Base URL',
                name: 'basePath',
                type: 'string',
                placeholder: 'http://localhost:8000'
            },
            {
                label: 'Model Name',
                name: 'modelName',
                type: 'string',
                placeholder: 'model_name'
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
                description:
                    'Allow image input. Image uploads need a model marked supports_vision=true in LiteLLM. Refer to the <a href="https://docs.flowiseai.com/using-flowise/uploads#image" target="_blank">docs</a> for more details.',
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
            },
            {
                label: 'Top P',
                name: 'topP',
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
            }
        ]
    }
    async init(nodeData, _, options) {
        const cache = nodeData.inputs?.cache
        const basePath = nodeData.inputs?.basePath
        const modelName = nodeData.inputs?.modelName
        const temperature = nodeData.inputs?.temperature
        const streaming = nodeData.inputs?.streaming
        const maxTokens = nodeData.inputs?.maxTokens
        const topP = nodeData.inputs?.topP
        const timeout = nodeData.inputs?.timeout
        const allowImageUploads = nodeData.inputs?.allowImageUploads
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options)
        const apiKey = (0, utils_1.getCredentialParam)('litellmApiKey', credentialData, nodeData)
        const obj = {
            temperature: parseFloat(temperature),
            modelName,
            streaming: streaming ?? true
        }
        if (basePath) {
            obj.configuration = {
                baseURL: basePath
            }
        }
        if (maxTokens) obj.maxTokens = parseInt(maxTokens, 10)
        if (topP) obj.topP = parseFloat(topP)
        if (timeout) obj.timeout = parseInt(timeout, 10)
        if (cache) obj.cache = cache
        if (apiKey) {
            obj.openAIApiKey = apiKey
            obj.apiKey = apiKey
        }
        const multiModalOption = {
            image: {
                allowImageUploads: allowImageUploads ?? false
            }
        }
        const model = new FlowiseChatOpenAI_1.ChatOpenAI(nodeData.id, obj)
        model.setMultiModalOption(multiModalOption)
        return model
    }
}
module.exports = { nodeClass: ChatLitellm_ChatModels }
//# sourceMappingURL=ChatLitellm.js.map
