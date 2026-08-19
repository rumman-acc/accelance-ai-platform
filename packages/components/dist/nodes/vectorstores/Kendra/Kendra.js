'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const lodash_1 = require('lodash')
const aws_1 = require('@langchain/aws')
const client_kendra_1 = require('@aws-sdk/client-kendra')
const documents_1 = require('@langchain/core/documents')
const utils_1 = require('../../../src/utils')
const awsToolsUtils_1 = require('../../../src/awsToolsUtils')
const VectorStoreUtils_1 = require('../VectorStoreUtils')
const modelLoader_1 = require('../../../src/modelLoader')
class Kendra_VectorStores {
    constructor() {
        this.loadMethods = {
            async listRegions() {
                return await (0, modelLoader_1.getRegions)(modelLoader_1.MODEL_TYPE.CHAT, 'awsChatBedrock')
            }
        }
        //@ts-ignore
        this.vectorStoreMethods = {
            async upsert(nodeData, options) {
                const indexId = nodeData.inputs?.indexId
                const region = nodeData.inputs?.region
                const docs = nodeData.inputs?.document
                const isFileUploadEnabled = nodeData.inputs?.fileUpload
                const credentialConfig = await (0, awsToolsUtils_1.getAWSCredentialConfig)(nodeData, options, region)
                let clientConfig = { region }
                if (credentialConfig.credentials) {
                    clientConfig.credentials = credentialConfig.credentials
                }
                const client = new client_kendra_1.KendraClient(clientConfig)
                const flattenDocs = docs && docs.length ? (0, lodash_1.flatten)(docs) : []
                const finalDocs = []
                const kendraDocuments = []
                for (let i = 0; i < flattenDocs.length; i += 1) {
                    if (flattenDocs[i] && flattenDocs[i].pageContent) {
                        if (isFileUploadEnabled && options.chatId) {
                            flattenDocs[i].metadata = { ...flattenDocs[i].metadata, [utils_1.FLOWISE_CHATID]: options.chatId }
                        }
                        finalDocs.push(new documents_1.Document(flattenDocs[i]))
                        // Prepare document for Kendra
                        const docId = `doc_${Date.now()}_${i}`
                        const docTitle = flattenDocs[i].metadata?.title || flattenDocs[i].metadata?.source || `Document ${i + 1}`
                        kendraDocuments.push({
                            Id: docId,
                            Title: docTitle,
                            Blob: new Uint8Array(Buffer.from(flattenDocs[i].pageContent, 'utf-8')),
                            ContentType: 'PLAIN_TEXT'
                        })
                    }
                }
                try {
                    if (kendraDocuments.length > 0) {
                        // Kendra has a limit of 10 documents per batch
                        const batchSize = 10
                        for (let i = 0; i < kendraDocuments.length; i += batchSize) {
                            const batch = kendraDocuments.slice(i, i + batchSize)
                            const command = new client_kendra_1.BatchPutDocumentCommand({
                                IndexId: indexId,
                                Documents: batch
                            })
                            const response = await client.send(command)
                            if (response.FailedDocuments && response.FailedDocuments.length > 0) {
                                console.error('Failed documents:', response.FailedDocuments)
                                throw new Error(`Failed to index some documents: ${JSON.stringify(response.FailedDocuments)}`)
                            }
                        }
                    }
                    return { numAdded: finalDocs.length, addedDocs: finalDocs }
                } catch (error) {
                    throw new Error(`Failed to index documents to Kendra: ${error}`)
                }
            },
            async delete(nodeData, ids, options) {
                const indexId = nodeData.inputs?.indexId
                const region = nodeData.inputs?.region
                const credentialConfig = await (0, awsToolsUtils_1.getAWSCredentialConfig)(nodeData, options, region)
                let clientConfig = { region }
                if (credentialConfig.credentials) {
                    clientConfig.credentials = credentialConfig.credentials
                }
                const client = new client_kendra_1.KendraClient(clientConfig)
                try {
                    // Kendra has a limit of 10 documents per batch delete
                    const batchSize = 10
                    for (let i = 0; i < ids.length; i += batchSize) {
                        const batch = ids.slice(i, i + batchSize)
                        const command = new client_kendra_1.BatchDeleteDocumentCommand({
                            IndexId: indexId,
                            DocumentIdList: batch
                        })
                        await client.send(command)
                    }
                } catch (error) {
                    throw new Error(`Failed to delete documents from Kendra: ${error}`)
                }
            }
        }
        this.label = 'AWS Kendra'
        this.name = 'kendra'
        this.version = 1.0
        this.type = 'Kendra'
        this.icon = 'kendra.svg'
        this.category = 'Vector Stores'
        this.description = `Use AWS Kendra's intelligent search service for document retrieval and semantic search`
        this.baseClasses = [this.type, 'VectorStoreRetriever', 'BaseRetriever']
        this.credential = {
            label: 'AWS Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['awsApi'],
            optional: true
        }
        this.inputs = [
            {
                label: 'Document',
                name: 'document',
                type: 'Document',
                list: true,
                optional: true
            },
            {
                label: 'Region',
                name: 'region',
                type: 'asyncOptions',
                loadMethod: 'listRegions',
                default: 'us-east-1'
            },
            {
                label: 'Kendra Index ID',
                name: 'indexId',
                type: 'string',
                placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
                description: 'The ID of your AWS Kendra index'
            },
            {
                label: 'File Upload',
                name: 'fileUpload',
                description: 'Allow file upload on the chat',
                hint: {
                    label: 'How to use',
                    value: VectorStoreUtils_1.howToUseFileUpload
                },
                type: 'boolean',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Top K',
                name: 'topK',
                description: 'Number of top results to fetch. Default to 10',
                placeholder: '10',
                type: 'number',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Attribute Filter',
                name: 'attributeFilter',
                description: 'Optional filter to apply when retrieving documents',
                type: 'json',
                optional: true,
                additionalParams: true,
                acceptVariable: true
            }
        ]
        // Note: Kendra doesn't support MMR search, but keeping the structure consistent
        this.outputs = [
            {
                label: 'Kendra Retriever',
                name: 'retriever',
                baseClasses: this.baseClasses
            },
            {
                label: 'Kendra Vector Store',
                name: 'vectorStore',
                baseClasses: [this.type, 'BaseRetriever']
            }
        ]
    }
    async init(nodeData, _, options) {
        const indexId = nodeData.inputs?.indexId
        const region = nodeData.inputs?.region
        const topK = nodeData.inputs?.topK
        const attributeFilter = nodeData.inputs?.attributeFilter
        const isFileUploadEnabled = nodeData.inputs?.fileUpload
        const credentialConfig = await (0, awsToolsUtils_1.getAWSCredentialConfig)(nodeData, options, region)
        let clientOptions = {}
        if (credentialConfig.credentials) {
            clientOptions.credentials = credentialConfig.credentials
        }
        let filter = undefined
        if (attributeFilter) {
            filter = typeof attributeFilter === 'object' ? attributeFilter : (0, utils_1.parseJsonBody)(attributeFilter)
        }
        // Add chat-specific filtering if file upload is enabled
        if (isFileUploadEnabled && options.chatId) {
            if (!filter) {
                filter = {}
            }
            filter.OrAllFilters = [
                ...(filter.OrAllFilters || []),
                {
                    EqualsTo: {
                        Key: utils_1.FLOWISE_CHATID,
                        Value: {
                            StringValue: options.chatId
                        }
                    }
                }
            ]
        }
        const retriever = new aws_1.AmazonKendraRetriever({
            topK: topK ? parseInt(topK) : 10,
            indexId,
            region,
            attributeFilter: filter,
            clientOptions
        })
        const output = nodeData.outputs?.output
        if (output === 'retriever') {
            return retriever
        } else if (output === 'vectorStore') {
            // Kendra doesn't have a traditional vector store interface,
            // but we can return the retriever with additional properties
            retriever.k = topK ? parseInt(topK) : 10
            retriever.filter = filter
            return retriever
        }
    }
}
module.exports = { nodeClass: Kendra_VectorStores }
//# sourceMappingURL=Kendra.js.map
