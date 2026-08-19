'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const lodash_1 = require('lodash')
const documents_1 = require('@langchain/core/documents')
const utils_1 = require('../../../src/utils')
const VectorStoreUtils_1 = require('../VectorStoreUtils')
const core_1 = require('./core')
// TODO: Add ability to specify env variable and use singleton pattern (i.e initialize MongoDB on server and pass to component)
class MongoDBAtlas_VectorStores {
    constructor() {
        //@ts-ignore
        this.vectorStoreMethods = {
            async upsert(nodeData, options) {
                const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options)
                const databaseName = nodeData.inputs?.databaseName
                const collectionName = nodeData.inputs?.collectionName
                const indexName = nodeData.inputs?.indexName
                let textKey = nodeData.inputs?.textKey
                let embeddingKey = nodeData.inputs?.embeddingKey
                const embeddings = nodeData.inputs?.embeddings
                let mongoDBConnectUrl = (0, utils_1.getCredentialParam)('mongoDBConnectUrl', credentialData, nodeData)
                const docs = nodeData.inputs?.document
                const flattenDocs = docs && docs.length ? (0, lodash_1.flatten)(docs) : []
                const finalDocs = []
                for (let i = 0; i < flattenDocs.length; i += 1) {
                    if (flattenDocs[i] && flattenDocs[i].pageContent) {
                        const document = new documents_1.Document(flattenDocs[i])
                        finalDocs.push(document)
                    }
                }
                try {
                    if (!textKey || textKey === '') textKey = 'text'
                    if (!embeddingKey || embeddingKey === '') embeddingKey = 'embedding'
                    const mongoDBAtlasVectorSearch = new core_1.MongoDBAtlasVectorSearch(embeddings, {
                        connectionDetails: { mongoDBConnectUrl, databaseName, collectionName },
                        indexName,
                        textKey,
                        embeddingKey
                    })
                    await mongoDBAtlasVectorSearch.addDocuments(finalDocs)
                    return { numAdded: finalDocs.length, addedDocs: finalDocs }
                } catch (e) {
                    throw new Error(e)
                }
            }
        }
        this.label = 'MongoDB Atlas'
        this.name = 'mongoDBAtlas'
        this.version = 1.0
        this.description = `Upsert embedded data and perform similarity or mmr search upon query using MongoDB Atlas, a managed cloud mongodb database`
        this.type = 'MongoDB Atlas'
        this.icon = 'mongodb.svg'
        this.category = 'Vector Stores'
        this.baseClasses = [this.type, 'VectorStoreRetriever', 'BaseRetriever']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['mongoDBUrlApi']
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
                label: 'Embeddings',
                name: 'embeddings',
                type: 'Embeddings'
            },
            {
                label: 'Database',
                name: 'databaseName',
                placeholder: '<DB_NAME>',
                type: 'string'
            },
            {
                label: 'Collection Name',
                name: 'collectionName',
                placeholder: '<COLLECTION_NAME>',
                type: 'string'
            },
            {
                label: 'Index Name',
                name: 'indexName',
                placeholder: '<VECTOR_INDEX_NAME>',
                type: 'string'
            },
            {
                label: 'Content Field',
                name: 'textKey',
                description: 'Name of the field (column) that contains the actual content',
                type: 'string',
                default: 'text',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Embedded Field',
                name: 'embeddingKey',
                description: 'Name of the field (column) that contains the Embedding',
                type: 'string',
                default: 'embedding',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Mongodb Metadata Filter',
                name: 'mongoMetadataFilter',
                type: 'json',
                optional: true,
                additionalParams: true,
                acceptVariable: true
            },
            {
                label: 'Top K',
                name: 'topK',
                description: 'Number of top results to fetch. Default to 4',
                placeholder: '4',
                type: 'number',
                additionalParams: true,
                optional: true
            }
        ]
        ;(0, VectorStoreUtils_1.addMMRInputParams)(this.inputs)
        this.outputs = [
            {
                label: 'MongoDB Retriever',
                name: 'retriever',
                baseClasses: this.baseClasses
            },
            {
                label: 'MongoDB Vector Store',
                name: 'vectorStore',
                baseClasses: [this.type, ...(0, utils_1.getBaseClasses)(core_1.MongoDBAtlasVectorSearch)]
            }
        ]
    }
    async init(nodeData, _, options) {
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options)
        const databaseName = nodeData.inputs?.databaseName
        const collectionName = nodeData.inputs?.collectionName
        const indexName = nodeData.inputs?.indexName
        let textKey = nodeData.inputs?.textKey
        let embeddingKey = nodeData.inputs?.embeddingKey
        const embeddings = nodeData.inputs?.embeddings
        const mongoMetadataFilter = nodeData.inputs?.mongoMetadataFilter
        let mongoDBConnectUrl = (0, utils_1.getCredentialParam)('mongoDBConnectUrl', credentialData, nodeData)
        const mongoDbFilter = {}
        try {
            if (!textKey || textKey === '') textKey = 'text'
            if (!embeddingKey || embeddingKey === '') embeddingKey = 'embedding'
            const vectorStore = new core_1.MongoDBAtlasVectorSearch(embeddings, {
                connectionDetails: { mongoDBConnectUrl, databaseName, collectionName },
                indexName,
                textKey,
                embeddingKey
            })
            if (mongoMetadataFilter) {
                const metadataFilter =
                    typeof mongoMetadataFilter === 'object' ? mongoMetadataFilter : (0, utils_1.parseJsonBody)(mongoMetadataFilter)
                for (const key in metadataFilter) {
                    mongoDbFilter.preFilter = {
                        ...mongoDbFilter.preFilter,
                        [key]: {
                            $eq: metadataFilter[key]
                        }
                    }
                }
            }
            return (0, VectorStoreUtils_1.resolveVectorStoreOrRetriever)(nodeData, vectorStore, mongoDbFilter)
        } catch (e) {
            throw new Error(e)
        }
    }
}
module.exports = { nodeClass: MongoDBAtlas_VectorStores }
//# sourceMappingURL=MongoDBAtlas.js.map
