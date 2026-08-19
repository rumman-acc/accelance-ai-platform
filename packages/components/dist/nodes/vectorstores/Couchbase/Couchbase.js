'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const lodash_1 = require('lodash')
const documents_1 = require('@langchain/core/documents')
const couchbase_search_1 = require('@langchain/community/vectorstores/couchbase_search')
const couchbase_1 = require('couchbase')
const utils_1 = require('../../../src/utils')
const VectorStoreUtils_1 = require('../VectorStoreUtils')
class Couchbase_VectorStores {
    constructor() {
        //@ts-ignore
        this.vectorStoreMethods = {
            async upsert(nodeData, options) {
                const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options)
                const bucketName = nodeData.inputs?.bucketName
                const scopeName = nodeData.inputs?.scopeName
                const collectionName = nodeData.inputs?.collectionName
                const indexName = nodeData.inputs?.indexName
                let textKey = nodeData.inputs?.textKey
                let embeddingKey = nodeData.inputs?.embeddingKey
                const embeddings = nodeData.inputs?.embeddings
                let connectionString = (0, utils_1.getCredentialParam)('connectionString', credentialData, nodeData)
                let databaseUsername = (0, utils_1.getCredentialParam)('username', credentialData, nodeData)
                let databasePassword = (0, utils_1.getCredentialParam)('password', credentialData, nodeData)
                const docs = nodeData.inputs?.document
                const flattenDocs = docs && docs.length ? (0, lodash_1.flatten)(docs) : []
                const finalDocs = []
                for (let i = 0; i < flattenDocs.length; i += 1) {
                    if (flattenDocs[i] && flattenDocs[i].pageContent) {
                        const document = new documents_1.Document(flattenDocs[i])
                        finalDocs.push(document)
                    }
                }
                const couchbaseClient = await couchbase_1.Cluster.connect(connectionString, {
                    username: databaseUsername,
                    password: databasePassword,
                    configProfile: 'wanDevelopment'
                })
                const couchbaseConfig = {
                    cluster: couchbaseClient,
                    bucketName: bucketName,
                    scopeName: scopeName,
                    collectionName: collectionName,
                    indexName: indexName,
                    textKey: textKey,
                    embeddingKey: embeddingKey
                }
                try {
                    if (!textKey || textKey === '') couchbaseConfig.textKey = 'text'
                    if (!embeddingKey || embeddingKey === '') couchbaseConfig.embeddingKey = 'embedding'
                    await couchbase_search_1.CouchbaseSearchVectorStore.fromDocuments(finalDocs, embeddings, couchbaseConfig)
                    return { numAdded: finalDocs.length, addedDocs: finalDocs }
                } catch (e) {
                    throw new Error(e)
                }
            }
        }
        this.label = 'Couchbase'
        this.name = 'couchbase'
        this.version = 1.0
        this.type = 'Couchbase'
        this.icon = 'couchbase.svg'
        this.category = 'Vector Stores'
        this.description = `Upsert embedded data and load existing index using Couchbase, a award-winning distributed NoSQL database`
        this.baseClasses = [this.type, 'VectorStoreRetriever', 'BaseRetriever']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['couchbaseApi']
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
                label: 'Bucket Name',
                name: 'bucketName',
                placeholder: '<DB_BUCKET_NAME>',
                type: 'string'
            },
            {
                label: 'Scope Name',
                name: 'scopeName',
                placeholder: '<SCOPE_NAME>',
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
                label: 'Couchbase Metadata Filter',
                name: 'couchbaseMetadataFilter',
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
        this.outputs = [
            {
                label: 'Couchbase Retriever',
                name: 'retriever',
                baseClasses: this.baseClasses
            },
            {
                label: 'Couchbase Vector Store',
                name: 'vectorStore',
                baseClasses: [this.type, ...(0, utils_1.getBaseClasses)(couchbase_search_1.CouchbaseSearchVectorStore)]
            }
        ]
    }
    async init(nodeData, _, options) {
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options)
        const bucketName = nodeData.inputs?.bucketName
        const scopeName = nodeData.inputs?.scopeName
        const collectionName = nodeData.inputs?.collectionName
        const indexName = nodeData.inputs?.indexName
        let textKey = nodeData.inputs?.textKey
        let embeddingKey = nodeData.inputs?.embeddingKey
        const embeddings = nodeData.inputs?.embeddings
        const couchbaseMetadataFilter = nodeData.inputs?.couchbaseMetadataFilter
        let connectionString = (0, utils_1.getCredentialParam)('connectionString', credentialData, nodeData)
        let databaseUsername = (0, utils_1.getCredentialParam)('username', credentialData, nodeData)
        let databasePassword = (0, utils_1.getCredentialParam)('password', credentialData, nodeData)
        let metadatafilter
        const couchbaseClient = await couchbase_1.Cluster.connect(connectionString, {
            username: databaseUsername,
            password: databasePassword,
            configProfile: 'wanDevelopment'
        })
        const couchbaseConfig = {
            cluster: couchbaseClient,
            bucketName: bucketName,
            scopeName: scopeName,
            collectionName: collectionName,
            indexName: indexName,
            textKey: textKey,
            embeddingKey: embeddingKey
        }
        try {
            if (!textKey || textKey === '') couchbaseConfig.textKey = 'text'
            if (!embeddingKey || embeddingKey === '') couchbaseConfig.embeddingKey = 'embedding'
            if (couchbaseMetadataFilter) {
                metadatafilter =
                    typeof couchbaseMetadataFilter === 'object'
                        ? couchbaseMetadataFilter
                        : (0, utils_1.parseJsonBody)(couchbaseMetadataFilter)
            }
            const vectorStore = await couchbase_search_1.CouchbaseSearchVectorStore.initialize(embeddings, couchbaseConfig)
            return (0, VectorStoreUtils_1.resolveVectorStoreOrRetriever)(nodeData, vectorStore, metadatafilter)
        } catch (e) {
            throw new Error(e)
        }
    }
}
module.exports = { nodeClass: Couchbase_VectorStores }
//# sourceMappingURL=Couchbase.js.map
