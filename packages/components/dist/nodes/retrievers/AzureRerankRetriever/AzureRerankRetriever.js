'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const contextual_compression_1 = require('@langchain/classic/retrievers/contextual_compression')
const AzureRerank_1 = require('./AzureRerank')
const src_1 = require('../../../src')
class AzureRerankRetriever_Retrievers {
    constructor() {
        this.label = 'Azure Rerank Retriever'
        this.name = 'AzureRerankRetriever'
        this.version = 1.0
        this.type = 'Azure Rerank Retriever'
        this.icon = 'azurefoundry.svg'
        this.category = 'Retrievers'
        this.description = 'Azure Rerank indexes the documents from most to least semantically relevant to the query.'
        this.baseClasses = [this.type, 'BaseRetriever']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['azureFoundryApi']
        }
        this.inputs = [
            {
                label: 'Vector Store Retriever',
                name: 'baseRetriever',
                type: 'VectorStoreRetriever'
            },
            {
                label: 'Model Name',
                name: 'model',
                type: 'options',
                options: [
                    {
                        label: 'rerank-v3.5',
                        name: 'rerank-v3.5'
                    },
                    {
                        label: 'rerank-english-v3.0',
                        name: 'rerank-english-v3.0'
                    },
                    {
                        label: 'rerank-multilingual-v3.0',
                        name: 'rerank-multilingual-v3.0'
                    },
                    {
                        label: 'Cohere-rerank-v4.0-fast',
                        name: 'Cohere-rerank-v4.0-fast'
                    },
                    {
                        label: 'Cohere-rerank-v4.0-pro',
                        name: 'Cohere-rerank-v4.0-pro'
                    }
                ],
                default: 'Cohere-rerank-v4.0-fast',
                optional: true
            },
            {
                label: 'Query',
                name: 'query',
                type: 'string',
                description: 'Query to retrieve documents from retriever. If not specified, user question will be used',
                optional: true,
                acceptVariable: true
            },
            {
                label: 'Top K',
                name: 'topK',
                description: 'Number of top results to fetch. Default to the TopK of the Base Retriever',
                placeholder: '4',
                type: 'number',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Max Chunks Per Doc',
                name: 'maxChunksPerDoc',
                description: 'The maximum number of chunks to produce internally from a document. Default to 10',
                placeholder: '10',
                type: 'number',
                additionalParams: true,
                optional: true
            }
        ]
        this.outputs = [
            {
                label: 'Azure Rerank Retriever',
                name: 'retriever',
                baseClasses: this.baseClasses
            },
            {
                label: 'Document',
                name: 'document',
                description: 'Array of document objects containing metadata and pageContent',
                baseClasses: ['Document', 'json']
            },
            {
                label: 'Text',
                name: 'text',
                description: 'Concatenated string from pageContent of documents',
                baseClasses: ['string', 'json']
            }
        ]
    }
    async init(nodeData, input, options) {
        const baseRetriever = nodeData.inputs?.baseRetriever
        const model = nodeData.inputs?.model
        const query = nodeData.inputs?.query
        const credentialData = await (0, src_1.getCredentialData)(nodeData.credential ?? '', options)
        const azureApiKey = (0, src_1.getCredentialParam)('azureFoundryApiKey', credentialData, nodeData)
        if (!azureApiKey) {
            throw new Error('Azure Foundry API Key is missing in credentials.')
        }
        const azureEndpoint = (0, src_1.getCredentialParam)('azureFoundryEndpoint', credentialData, nodeData)
        if (!azureEndpoint) {
            throw new Error('Azure Foundry Endpoint is missing in credentials.')
        }
        const topK = nodeData.inputs?.topK
        const k = topK ? parseFloat(topK) : baseRetriever.k ?? 4
        const maxChunksPerDoc = nodeData.inputs?.maxChunksPerDoc
        const maxChunksPerDocValue = maxChunksPerDoc ? parseFloat(maxChunksPerDoc) : 10
        const output = nodeData.outputs?.output
        const azureCompressor = new AzureRerank_1.AzureRerank(azureApiKey, azureEndpoint, model, k, maxChunksPerDocValue)
        const retriever = new contextual_compression_1.ContextualCompressionRetriever({
            baseCompressor: azureCompressor,
            baseRetriever: baseRetriever
        })
        if (output === 'retriever') return retriever
        else if (output === 'document') return await retriever._getRelevantDocuments(query ? query : input)
        else if (output === 'text') {
            let finaltext = ''
            const docs = await retriever._getRelevantDocuments(query ? query : input)
            for (const doc of docs) finaltext += `${doc.pageContent}\n`
            return (0, src_1.handleEscapeCharacters)(finaltext, false)
        }
        return retriever
    }
}
module.exports = { nodeClass: AzureRerankRetriever_Retrievers }
//# sourceMappingURL=AzureRerankRetriever.js.map
