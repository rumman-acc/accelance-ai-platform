'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const tavily_1 = require('@langchain/tavily')
const utils_1 = require('../../../src/utils')
class TavilyAPI_Tools {
    constructor() {
        this.label = 'Tavily API'
        this.name = 'tavilyAPI'
        this.version = 1.2
        this.type = 'TavilyAPI'
        this.icon = 'tavily.svg'
        this.category = 'Tools'
        this.description = 'Wrapper around TavilyAPI - A specialized search engine designed for LLMs and AI agents'
        this.inputs = [
            {
                label: 'Topic',
                name: 'topic',
                type: 'options',
                options: [
                    { label: 'General', name: 'general' },
                    { label: 'News', name: 'news' }
                ],
                default: 'general',
                description: 'The category of the search. News for real-time updates, general for broader searches',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Search Depth',
                name: 'searchDepth',
                type: 'options',
                options: [
                    { label: 'Basic', name: 'basic' },
                    { label: 'Advanced', name: 'advanced' }
                ],
                default: 'basic',
                description: 'The depth of the search. Advanced costs 2 API Credits, basic costs 1',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Chunks Per Source',
                name: 'chunksPerSource',
                type: 'number',
                default: 3,
                description: 'Number of content chunks per source (1-3). Only for advanced search',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Max Results',
                name: 'maxResults',
                type: 'number',
                default: 5,
                additionalParams: true,
                description: 'Maximum number of search results (0-20)',
                optional: true
            },
            {
                label: 'Time Range',
                name: 'timeRange',
                type: 'options',
                options: [
                    { label: 'Day', name: 'day' },
                    { label: 'Week', name: 'week' },
                    { label: 'Month', name: 'month' },
                    { label: 'Year', name: 'year' }
                ],
                optional: true,
                additionalParams: true,
                description: 'Time range to filter results'
            },
            {
                label: 'Days',
                name: 'days',
                type: 'number',
                default: 7,
                additionalParams: true,
                description: 'Number of days back from current date (only for news topic)',
                optional: true
            },
            {
                label: 'Include Answer',
                name: 'includeAnswer',
                type: 'boolean',
                default: false,
                description: 'Include an LLM-generated answer to the query',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Include Raw Content',
                name: 'includeRawContent',
                type: 'boolean',
                default: false,
                description: 'Include cleaned and parsed HTML content of each result',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Include Images',
                name: 'includeImages',
                type: 'boolean',
                default: false,
                description: 'Include image search results',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Include Image Descriptions',
                name: 'includeImageDescriptions',
                type: 'boolean',
                default: false,
                description: 'Include descriptive text for each image',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Include Domains',
                name: 'includeDomains',
                type: 'string',
                optional: true,
                description: 'Comma-separated list of domains to include in results',
                additionalParams: true
            },
            {
                label: 'Exclude Domains',
                name: 'excludeDomains',
                type: 'string',
                optional: true,
                description: 'Comma-separated list of domains to exclude from results',
                additionalParams: true
            }
        ]
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['tavilyApi']
        }
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(tavily_1.TavilySearch)]
    }
    async init(nodeData, _, options) {
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options)
        const tavilyApiKey = (0, utils_1.getCredentialParam)('tavilyApiKey', credentialData, nodeData)
        const topic = nodeData.inputs?.topic
        const searchDepth = nodeData.inputs?.searchDepth
        const chunksPerSource = nodeData.inputs?.chunksPerSource
        const maxResults = nodeData.inputs?.maxResults
        const timeRange = nodeData.inputs?.timeRange
        const days = nodeData.inputs?.days
        const includeAnswer = nodeData.inputs?.includeAnswer
        const includeRawContent = nodeData.inputs?.includeRawContent
        const includeImages = nodeData.inputs?.includeImages
        const includeImageDescriptions = nodeData.inputs?.includeImageDescriptions
        const includeDomains = nodeData.inputs?.includeDomains
        const excludeDomains = nodeData.inputs?.excludeDomains
        const config = {
            tavilyApiKey: tavilyApiKey,
            topic,
            searchDepth,
            maxResults,
            includeAnswer: includeAnswer || undefined,
            includeRawContent: includeRawContent || undefined,
            includeImages: includeImages || undefined,
            includeImageDescriptions: includeImageDescriptions || undefined
        }
        if (chunksPerSource) config.chunksPerSource = chunksPerSource
        if (timeRange) config.timeRange = timeRange
        if (days) config.days = days
        if (includeDomains) config.includeDomains = includeDomains.split(',').map((d) => d.trim())
        if (excludeDomains) config.excludeDomains = excludeDomains.split(',').map((d) => d.trim())
        return new tavily_1.TavilySearch(config)
    }
}
module.exports = { nodeClass: TavilyAPI_Tools }
//# sourceMappingURL=TavilyAPI.js.map
