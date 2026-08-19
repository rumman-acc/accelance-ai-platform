'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const anthropic_1 = require('@langchain/anthropic')
const utils_1 = require('../../../src/utils')
const FlowiseChatAnthropic_1 = require('./FlowiseChatAnthropic')
const modelLoader_1 = require('../../../src/modelLoader')
const anthropicUtils_1 = require('../../../src/anthropicUtils')
class ChatAnthropic_ChatModels {
    constructor() {
        //@ts-ignore
        this.loadMethods = {
            async listModels() {
                return await (0, modelLoader_1.getModels)(modelLoader_1.MODEL_TYPE.CHAT, 'chatAnthropic')
            }
        }
        this.label = 'Anthropic Claude'
        this.name = 'chatAnthropic'
        this.version = 8.0
        this.type = 'ChatAnthropic'
        this.icon = 'Anthropic.svg'
        this.category = 'Chat Models'
        this.description = 'Wrapper around ChatAnthropic large language models that use the Chat endpoint'
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(anthropic_1.ChatAnthropic)]
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['anthropicApi']
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
                default: 'claude-haiku-4-5'
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
            /*  The manual thinking: {type: "enabled", budget_tokens: N} configuration is deprecated on Opus 4.6 and will be removed in a future model release */
            {
                label: 'Extended Thinking',
                name: 'extendedThinking',
                type: 'boolean',
                description: 'Enable extended thinking for reasoning model such as Claude Sonnet 3.7 and Claude 4',
                optional: true,
                additionalParams: true,
                hide: {
                    modelName: ['claude-opus-5', 'claude-sonnet-5', 'claude-opus-4-7', 'claude-opus-4-6', 'claude-sonnet-4-6']
                }
            },
            {
                label: 'Budget Tokens',
                name: 'budgetTokens',
                type: 'number',
                step: 1,
                default: '1024',
                description: 'Maximum number of tokens Claude is allowed use for its internal reasoning process',
                optional: true,
                additionalParams: true,
                show: {
                    extendedThinking: true
                },
                hide: {
                    modelName: ['claude-opus-5', 'claude-sonnet-5', 'claude-opus-4-7', 'claude-opus-4-6', 'claude-sonnet-4-6']
                }
            },
            {
                label: 'Adaptive Thinking',
                description:
                    'Claude evaluates the complexity of each request and determines whether and how much to use extended thinking.',
                name: 'adaptiveThinking',
                type: 'boolean',
                default: false,
                optional: true,
                additionalParams: true,
                show: {
                    modelName: ['claude-opus-5', 'claude-sonnet-5', 'claude-opus-4-7', 'claude-opus-4-6', 'claude-sonnet-4-6']
                }
            },
            {
                label: 'Thinking Effort',
                description: 'Control how eager Claude is about spending tokens when responding to requests',
                name: 'thinkingEffort',
                type: 'options',
                optional: true,
                options: [
                    {
                        label: 'Low',
                        name: 'low'
                    },
                    {
                        label: 'Medium',
                        name: 'medium'
                    },
                    {
                        label: 'High',
                        name: 'high'
                    },
                    {
                        label: 'Max',
                        name: 'max',
                        description: 'Absolute maximum capability with no constraints on token spending. Opus 4.6 and newer only'
                    }
                ],
                additionalParams: true,
                show: {
                    adaptiveThinking: true,
                    modelName: ['claude-opus-5', 'claude-sonnet-5', 'claude-opus-4-7', 'claude-opus-4-6', 'claude-sonnet-4-6']
                }
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
            },
            {
                label: 'Top K',
                name: 'topK',
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
        const maxTokens = nodeData.inputs?.maxTokensToSample
        const topP = nodeData.inputs?.topP
        const topK = nodeData.inputs?.topK
        const streaming = nodeData.inputs?.streaming
        const cache = nodeData.inputs?.cache
        const extendedThinking = nodeData.inputs?.extendedThinking
        const budgetTokens = nodeData.inputs?.budgetTokens
        const adaptiveThinking = nodeData.inputs?.adaptiveThinking
        const thinkingEffort = nodeData.inputs?.thinkingEffort
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options)
        const anthropicApiKey = (0, utils_1.getCredentialParam)('anthropicApiKey', credentialData, nodeData)
        const allowImageUploads = nodeData.inputs?.allowImageUploads
        const samplingSupported = (0, anthropicUtils_1.supportsSamplingParams)(modelName)
        const thinkingEnabled = adaptiveThinking || extendedThinking
        const obj = {
            modelName,
            anthropicApiKey,
            streaming: streaming ?? true
        }
        // Temperature is incompatible with thinking modes and with models that
        // don't support sampling parameters.
        if (samplingSupported && !thinkingEnabled) {
            obj.temperature = parseFloat(temperature)
        }
        if (maxTokens) obj.maxTokens = parseInt(maxTokens, 10)
        if (samplingSupported && topP) obj.topP = parseFloat(topP)
        if (samplingSupported && topK) obj.topK = parseFloat(topK)
        if (cache) obj.cache = cache
        if (adaptiveThinking) {
            obj.thinking = {
                type: 'adaptive'
            }
            if (thinkingEffort) {
                obj.outputConfig = {
                    effort: thinkingEffort
                }
            }
        } else if (extendedThinking) {
            obj.thinking = {
                type: 'enabled',
                budget_tokens: parseInt(budgetTokens ?? '1024', 10)
            }
        }
        const multiModalOption = {
            image: {
                allowImageUploads: allowImageUploads ?? false
            }
        }
        const model = new FlowiseChatAnthropic_1.ChatAnthropic(nodeData.id, obj)
        model.setMultiModalOption(multiModalOption)
        return model
    }
}
module.exports = { nodeClass: ChatAnthropic_ChatModels }
//# sourceMappingURL=ChatAnthropic.js.map
