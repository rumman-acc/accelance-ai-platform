'use strict'
var __importDefault =
    (this && this.__importDefault) ||
    function (mod) {
        return mod && mod.__esModule ? mod : { default: mod }
    }
Object.defineProperty(exports, '__esModule', { value: true })
const lodash_1 = require('lodash')
const documents_1 = require('@langchain/core/documents')
const base_1 = require('@langchain/classic/document_loaders/base')
const utils_1 = require('../../../src/utils')
const SpiderApp_1 = __importDefault(require('./SpiderApp'))
class SpiderLoader extends base_1.BaseDocumentLoader {
    constructor(loaderParams) {
        super()
        const { apiKey, url, mode = 'crawl', limit, additionalMetadata, params } = loaderParams
        if (!apiKey) {
            throw new Error('Spider API key not set. You can set it as SPIDER_API_KEY in your .env file, or pass it to Spider.')
        }
        this.apiKey = apiKey
        this.url = url
        this.mode = mode
        this.limit = Number(limit)
        this.additionalMetadata = additionalMetadata
        this.params = params
    }
    async load() {
        const app = new SpiderApp_1.default({ apiKey: this.apiKey })
        let spiderDocs
        if (this.mode === 'scrape') {
            const response = await app.scrapeUrl(this.url, this.params)
            if (!response.success) {
                throw new Error(`Spider: Failed to scrape URL. Error: ${response.error}`)
            }
            spiderDocs = [response.data]
        } else if (this.mode === 'crawl') {
            if (this.params) {
                this.params.limit = this.limit
            }
            const response = await app.crawlUrl(this.url, this.params)
            if (!response.success) {
                throw new Error(`Spider: Failed to crawl URL. Error: ${response.error}`)
            }
            spiderDocs = response.data
        } else {
            throw new Error(`Unrecognized mode '${this.mode}'. Expected one of 'crawl', 'scrape'.`)
        }
        return spiderDocs.map(
            (doc) =>
                new documents_1.Document({
                    pageContent: doc.content || '',
                    metadata: {
                        ...(this.additionalMetadata || {}),
                        source: doc.url
                    }
                })
        )
    }
}
class Spider_DocumentLoaders {
    constructor() {
        this.label = 'Spider Document Loaders'
        this.name = 'spiderDocumentLoaders'
        this.version = 2.0
        this.type = 'Document'
        this.icon = 'spider.svg'
        this.category = 'Document Loaders'
        this.description = 'Scrape & Crawl the web with Spider'
        this.baseClasses = [this.type]
        this.inputs = [
            {
                label: 'Text Splitter',
                name: 'textSplitter',
                type: 'TextSplitter',
                optional: true
            },
            {
                label: 'Mode',
                name: 'mode',
                type: 'options',
                options: [
                    {
                        label: 'Scrape',
                        name: 'scrape',
                        description: 'Scrape a single page'
                    },
                    {
                        label: 'Crawl',
                        name: 'crawl',
                        description: 'Crawl a website and extract pages within the same domain'
                    }
                ],
                default: 'scrape'
            },
            {
                label: 'Web Page URL',
                name: 'url',
                type: 'string',
                placeholder: 'https://spider.cloud'
            },
            {
                label: 'Limit',
                name: 'limit',
                type: 'number',
                default: 25
            },
            {
                label: 'Additional Metadata',
                name: 'additional_metadata',
                type: 'json',
                description: 'Additional metadata to be added to the extracted documents',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Additional Parameters',
                name: 'params',
                description:
                    'Find all the available parameters in the <a _target="blank" href="https://spider.cloud/docs/api">Spider API documentation</a>',
                additionalParams: true,
                placeholder: '{ "anti_bot": true }',
                type: 'json',
                optional: true
            },
            {
                label: 'Omit Metadata Keys',
                name: 'omitMetadataKeys',
                type: 'string',
                rows: 4,
                description:
                    'Each document loader comes with a default set of metadata keys that are extracted from the document. You can use this field to omit some of the default metadata keys. The value should be a list of keys, seperated by comma. Use * to omit all metadata keys execept the ones you specify in the Additional Metadata field',
                placeholder: 'key1, key2, key3.nestedKey1',
                optional: true,
                additionalParams: true
            }
        ]
        this.credential = {
            label: 'Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['spiderApi']
        }
        this.outputs = [
            {
                label: 'Document',
                name: 'document',
                description: 'Array of document objects containing metadata and pageContent',
                baseClasses: [...this.baseClasses, 'json']
            },
            {
                label: 'Text',
                name: 'text',
                description: 'Concatenated string from pageContent of documents',
                baseClasses: ['string', 'json']
            }
        ]
    }
    async init(nodeData, _, options) {
        const textSplitter = nodeData.inputs?.textSplitter
        const url = nodeData.inputs?.url
        const mode = nodeData.inputs?.mode
        const limit = nodeData.inputs?.limit
        let additionalMetadata = nodeData.inputs?.additional_metadata
        let params = nodeData.inputs?.params || {}
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options)
        const spiderApiKey = (0, utils_1.getCredentialParam)('spiderApiKey', credentialData, nodeData)
        const _omitMetadataKeys = nodeData.inputs?.omitMetadataKeys
        const output = nodeData.outputs?.output
        let omitMetadataKeys = []
        if (_omitMetadataKeys) {
            omitMetadataKeys = _omitMetadataKeys.split(',').map((key) => key.trim())
        }
        if (typeof params === 'string') {
            try {
                params = JSON.parse(params)
            } catch (e) {
                console.error('Invalid JSON string provided for params')
            }
        }
        if (additionalMetadata) {
            if (typeof additionalMetadata === 'string') {
                try {
                    additionalMetadata = JSON.parse(additionalMetadata)
                } catch (e) {
                    console.error('Invalid JSON string provided for additional metadata')
                }
            } else if (typeof additionalMetadata !== 'object') {
                console.error('Additional metadata must be a valid JSON object')
            }
        } else {
            additionalMetadata = {}
        }
        // Ensure return_format is set to markdown
        params.return_format = 'markdown'
        const input = {
            url,
            mode: mode,
            apiKey: spiderApiKey,
            limit: limit,
            additionalMetadata: additionalMetadata,
            params: params
        }
        const loader = new SpiderLoader(input)
        let docs = []
        if (textSplitter) {
            docs = await loader.load()
            docs = await textSplitter.splitDocuments(docs)
        } else {
            docs = await loader.load()
        }
        docs = docs.map((doc) => ({
            ...doc,
            metadata:
                _omitMetadataKeys === '*'
                    ? additionalMetadata
                    : (0, lodash_1.omit)(
                          {
                              ...doc.metadata,
                              ...additionalMetadata
                          },
                          omitMetadataKeys
                      )
        }))
        if (output === 'document') {
            return docs
        } else {
            let finaltext = ''
            for (const doc of docs) {
                finaltext += `${doc.pageContent}\n`
            }
            return (0, utils_1.handleEscapeCharacters)(finaltext, false)
        }
    }
}
module.exports = { nodeClass: Spider_DocumentLoaders }
//# sourceMappingURL=Spider.js.map
