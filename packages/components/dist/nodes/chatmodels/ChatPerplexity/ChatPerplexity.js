'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const perplexity_1 = require('@langchain/community/chat_models/perplexity')
const utils_1 = require('../../../src/utils')
const FlowiseChatPerplexity_1 = require('./FlowiseChatPerplexity')
const modelLoader_1 = require('../../../src/modelLoader')
class ChatPerplexity_ChatModels {
    constructor() {
        //@ts-ignore
        this.loadMethods = {
            async listModels() {
                return await (0, modelLoader_1.getModels)(modelLoader_1.MODEL_TYPE.CHAT, 'chatPerplexity')
            }
        }
        this.label = 'Perplexity'
        this.name = 'chatPerplexity'
        this.version = 0.1
        this.type = 'ChatPerplexity'
        this.icon = 'perplexity.svg'
        this.category = 'Chat Models'
        this.description = 'Wrapper around Perplexity large language models that use the Chat endpoint'
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(perplexity_1.ChatPerplexity)]
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['perplexityApi']
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
                name: 'model',
                type: 'asyncOptions',
                loadMethod: 'listModels',
                default: 'sonar'
            },
            {
                label: 'Temperature',
                name: 'temperature',
                type: 'number',
                step: 0.1,
                default: 1,
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
                label: 'Top K',
                name: 'topK',
                type: 'number',
                step: 1,
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
                label: 'Frequency Penalty',
                name: 'frequencyPenalty',
                type: 'number',
                step: 0.1,
                optional: true,
                additionalParams: true
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
                label: 'Timeout',
                name: 'timeout',
                type: 'number',
                step: 1,
                optional: true,
                additionalParams: true
            },
            // {
            //     label: 'Search Domain Filter',
            //     name: 'searchDomainFilter',
            //     type: 'json',
            //     optional: true,
            //     additionalParams: true,
            //     description: 'Limit citations to URLs from specified domains (e.g., ["example.com", "anotherexample.org"])'
            // },
            // Currently disabled as output is stored as additional_kwargs
            // {
            //     label: 'Return Images',
            //     name: 'returnImages',
            //     type: 'boolean',
            //     optional: true,
            //     additionalParams: true,
            //     description: 'Whether the model should return images (if supported by the model)'
            // },
            // Currently disabled as output is stored as additional_kwargs
            // {
            //     label: 'Return Related Questions',
            //     name: 'returnRelatedQuestions',
            //     type: 'boolean',
            //     optional: true,
            //     additionalParams: true,
            //     description: 'Whether the online model should return related questions'
            // },
            // {
            //     label: 'Search Recency Filter',
            //     name: 'searchRecencyFilter',
            //     type: 'options',
            //     options: [
            //         { label: 'Not Set', name: '' },
            //         { label: 'Month', name: 'month' },
            //         { label: 'Week', name: 'week' },
            //         { label: 'Day', name: 'day' },
            //         { label: 'Hour', name: 'hour' }
            //     ],
            //     default: '',
            //     optional: true,
            //     additionalParams: true,
            //     description: 'Filter search results by time interval (does not apply to images)'
            // },
            {
                label: 'Proxy Url',
                name: 'proxyUrl',
                type: 'string',
                optional: true,
                additionalParams: true
            }
            // LangchainJS currently does not has a web_search_options, search_after_date_filter or search_before_date_filter parameter.
            // To add web_search_options (user_location, search_context_size) and search_after_date_filter, search_before_date_filter as a modelKwargs parameter.
        ]
    }
    async init(nodeData, _, options) {
        const model = nodeData.inputs?.model
        const temperature = nodeData.inputs?.temperature
        const maxTokens = nodeData.inputs?.maxTokens
        const topP = nodeData.inputs?.topP
        const topK = nodeData.inputs?.topK
        const presencePenalty = nodeData.inputs?.presencePenalty
        const frequencyPenalty = nodeData.inputs?.frequencyPenalty
        const streaming = nodeData.inputs?.streaming
        const timeout = nodeData.inputs?.timeout
        const searchDomainFilterRaw = nodeData.inputs?.searchDomainFilter
        const returnImages = nodeData.inputs?.returnImages
        const returnRelatedQuestions = nodeData.inputs?.returnRelatedQuestions
        const searchRecencyFilter = nodeData.inputs?.searchRecencyFilter
        const proxyUrl = nodeData.inputs?.proxyUrl
        const cache = nodeData.inputs?.cache
        if (nodeData.inputs?.credentialId) {
            nodeData.credential = nodeData.inputs?.credentialId
        }
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options)
        const apiKey = (0, utils_1.getCredentialParam)('perplexityApiKey', credentialData, nodeData)
        if (!apiKey) {
            throw new Error('Perplexity API Key missing from credential')
        }
        const obj = {
            model,
            apiKey,
            streaming: streaming ?? true
        }
        if (temperature) obj.temperature = parseFloat(temperature)
        if (maxTokens) obj.maxTokens = parseInt(maxTokens, 10)
        if (topP) obj.topP = parseFloat(topP)
        if (topK) obj.topK = parseInt(topK, 10)
        if (presencePenalty) obj.presencePenalty = parseFloat(presencePenalty)
        if (frequencyPenalty) obj.frequencyPenalty = parseFloat(frequencyPenalty)
        if (timeout) obj.timeout = parseInt(timeout, 10)
        if (returnImages) obj.returnImages = returnImages
        if (returnRelatedQuestions) obj.returnRelatedQuestions = returnRelatedQuestions
        if (searchRecencyFilter && searchRecencyFilter !== '') obj.searchRecencyFilter = searchRecencyFilter
        if (cache) obj.cache = cache
        if (searchDomainFilterRaw) {
            try {
                obj.searchDomainFilter =
                    typeof searchDomainFilterRaw === 'object' ? searchDomainFilterRaw : JSON.parse(searchDomainFilterRaw)
            } catch (exception) {
                throw new Error('Invalid JSON in Search Domain Filter: ' + exception)
            }
        }
        if (proxyUrl) {
            console.warn('Proxy configuration for ChatPerplexity might require adjustments to FlowiseChatPerplexity wrapper.')
        }
        const perplexityModel = new FlowiseChatPerplexity_1.ChatPerplexity(nodeData.id, obj)
        return perplexityModel
    }
}
module.exports = { nodeClass: ChatPerplexity_ChatModels }
//# sourceMappingURL=ChatPerplexity.js.map
