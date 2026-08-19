'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const google_vertexai_1 = require('@langchain/google-vertexai')
const google_utils_1 = require('../../../src/google-utils')
const modelLoader_1 = require('../../../src/modelLoader')
const utils_1 = require('../../../src/utils')
const anthropicUtils_1 = require('../../../src/anthropicUtils')
class ChatVertexAI extends google_vertexai_1.ChatVertexAI {
    constructor(id, fields) {
        // @ts-ignore
        if (fields?.model) {
            fields.modelName = fields.model
            delete fields.model
        }
        super(fields ?? {})
        this.id = id
        this.configuredModel = fields?.modelName || ''
        this.configuredMaxToken = fields?.maxOutputTokens ?? 2048
    }
    setMultiModalOption(multiModalOption) {
        this.multiModalOption = multiModalOption
    }
}
class GoogleVertexAI_ChatModels {
    constructor() {
        //@ts-ignore
        this.loadMethods = {
            async listModels() {
                return await (0, modelLoader_1.getModels)(modelLoader_1.MODEL_TYPE.CHAT, 'chatGoogleVertexAI')
            },
            async listRegions() {
                return await (0, modelLoader_1.getRegions)(modelLoader_1.MODEL_TYPE.CHAT, 'chatGoogleVertexAI')
            }
        }
        this.label = 'Google VertexAI'
        this.name = 'chatGoogleVertexAI'
        this.version = 5.3
        this.type = 'ChatGoogleVertexAI'
        this.icon = 'GoogleVertex.svg'
        this.category = 'Chat Models'
        this.description = 'Wrapper around VertexAI large language models that use the Chat endpoint'
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(ChatVertexAI)]
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['googleVertexAuth'],
            optional: true,
            description:
                'Google Vertex AI credential. If you are using a GCP service like Cloud Run, or if you have installed default credentials on your local machine, you do not need to set this credential.'
        }
        this.inputs = [
            {
                label: 'Cache',
                name: 'cache',
                type: 'BaseCache',
                optional: true
            },
            {
                label: 'Region',
                description: 'Region to use for the model.',
                name: 'region',
                type: 'asyncOptions',
                loadMethod: 'listRegions',
                optional: true
            },
            {
                label: 'Model Name',
                name: 'modelName',
                type: 'asyncOptions',
                loadMethod: 'listModels'
            },
            {
                label: 'Custom Model Name',
                name: 'customModelName',
                type: 'string',
                placeholder: 'gemini-1.5-pro-exp-0801',
                description: 'Custom model name to use. If provided, it will override the model selected',
                additionalParams: true,
                optional: true
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
                    'Allow image input. Refer to the <a href="https://docs.flowiseai.com/using-flowise/uploads#image" target="_blank">docs</a> for more details.',
                default: false,
                optional: true
            },
            /** The thinkingLevel parameter, recommended for Gemini 3 models and onwards. */
            {
                label: 'Thinking Budget',
                name: 'thinkingBudget',
                type: 'number',
                description: 'Guides the number of thinking tokens. -1 for dynamic, 0 to disable, or positive integer (Gemini 2.5 models).',
                step: 1,
                optional: true,
                additionalParams: true,
                show: {
                    modelName: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.5-flash-lite']
                }
            },
            {
                label: 'Thinking Level',
                name: 'thinkingLevel',
                type: 'options',
                description: 'Adjust the amount of reasoning effort based on the complexity of the user request',
                options: [
                    {
                        label: 'Low',
                        name: 'LOW'
                    },
                    {
                        label: 'Medium',
                        name: 'MEDIUM'
                    },
                    {
                        label: 'High',
                        name: 'HIGH'
                    }
                ],
                optional: true,
                additionalParams: true,
                show: {
                    modelName: ['gemini-3.1-pro-preview', 'gemini-3.1-flash-lite-preview', 'gemini-3-flash-preview']
                }
            },
            {
                label: 'Max Output Tokens',
                name: 'maxOutputTokens',
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
                label: 'Top Next Highest Probability Tokens',
                name: 'topK',
                type: 'number',
                description: `Decode using top-k sampling: consider the set of top_k most probable tokens. Must be positive`,
                step: 1,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Thinking Budget',
                name: 'thinkingBudget',
                type: 'number',
                description: 'Number of tokens to use for thinking process (0 to disable)',
                step: 1,
                placeholder: '1024',
                optional: true,
                additionalParams: true
            }
        ]
    }
    async init(nodeData, _, options) {
        const temperature = nodeData.inputs?.temperature
        const modelName = nodeData.inputs?.modelName
        const customModelName = nodeData.inputs?.customModelName
        const maxOutputTokens = nodeData.inputs?.maxOutputTokens
        const topP = nodeData.inputs?.topP
        const cache = nodeData.inputs?.cache
        const topK = nodeData.inputs?.topK
        const streaming = nodeData.inputs?.streaming
        const region = nodeData.inputs?.region
        const thinkingBudget = nodeData.inputs?.thinkingBudget
        const thinkingLevel = nodeData.inputs?.thinkingLevel
        const allowImageUploads = nodeData.inputs?.allowImageUploads
        const multiModalOption = {
            image: {
                allowImageUploads: allowImageUploads ?? false
            }
        }
        const resolvedModelName = customModelName || modelName
        // Newer Anthropic Claude models hosted on Vertex (Opus 4.7+) don't
        // accept sampling parameters. Gemini and older Claude models are
        // unaffected because their names won't match the patterns.
        const samplingSupported = (0, anthropicUtils_1.supportsSamplingParams)(resolvedModelName)
        const obj = {
            modelName: resolvedModelName,
            streaming: streaming ?? true
        }
        if (samplingSupported) {
            obj.temperature = parseFloat(temperature)
        }
        const authOptions = await (0, google_utils_1.buildGoogleCredentials)(nodeData, options)
        if (authOptions && Object.keys(authOptions).length !== 0) obj.authOptions = authOptions
        if (maxOutputTokens) obj.maxOutputTokens = parseInt(maxOutputTokens, 10)
        if (samplingSupported && topP) obj.topP = parseFloat(topP)
        if (cache) obj.cache = cache
        if (samplingSupported && topK) obj.topK = parseFloat(topK)
        if (region) obj.location = region
        if (thinkingLevel) {
            obj.thinkingConfig = {
                thinkingLevel: thinkingLevel,
                includeThoughts: true
            }
        } else if (thinkingBudget) {
            obj.thinkingConfig = {
                thinkingBudget: parseInt(thinkingBudget, 10),
                includeThoughts: true
            }
        }
        const model = new ChatVertexAI(nodeData.id, obj)
        model.setMultiModalOption(multiModalOption)
        return model
    }
}
module.exports = { nodeClass: GoogleVertexAI_ChatModels }
//# sourceMappingURL=ChatGoogleVertexAI.js.map
