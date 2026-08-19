'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const lodash_1 = require('lodash')
const zep_cloud_1 = require('@getzep/zep-cloud')
const zep_cloud_2 = require('@langchain/community/vectorstores/zep_cloud')
const documents_1 = require('@langchain/core/documents')
const utils_1 = require('../../../src/utils')
const VectorStoreUtils_1 = require('../VectorStoreUtils')
const fake_1 = require('@langchain/classic/embeddings/fake')
class Zep_CloudVectorStores {
    constructor() {
        //@ts-ignore
        this.vectorStoreMethods = {
            async upsert(nodeData, options) {
                const zepCollection = nodeData.inputs?.zepCollection
                const docs = nodeData.inputs?.document
                const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options)
                const apiKey = (0, utils_1.getCredentialParam)('apiKey', credentialData, nodeData)
                const flattenDocs = docs && docs.length ? (0, lodash_1.flatten)(docs) : []
                const finalDocs = []
                for (let i = 0; i < flattenDocs.length; i += 1) {
                    if (flattenDocs[i] && flattenDocs[i].pageContent) {
                        finalDocs.push(new documents_1.Document(flattenDocs[i]))
                    }
                }
                const client = new zep_cloud_1.ZepClient({
                    apiKey: apiKey
                })
                const zepConfig = {
                    apiKey: apiKey,
                    collectionName: zepCollection,
                    client
                }
                try {
                    await zep_cloud_2.ZepCloudVectorStore.fromDocuments(finalDocs, new fake_1.FakeEmbeddings(), zepConfig)
                    return { numAdded: finalDocs.length, addedDocs: finalDocs }
                } catch (e) {
                    throw new Error(e)
                }
            }
        }
        this.label = 'Zep Collection - Cloud'
        this.name = 'zepCloud'
        this.version = 2.0
        this.type = 'Zep'
        this.icon = 'zep.svg'
        this.category = 'Vector Stores'
        this.description =
            'Upsert embedded data and perform similarity or mmr search upon query using Zep, a fast and scalable building block for LLM apps'
        this.baseClasses = [this.type, 'VectorStoreRetriever', 'BaseRetriever']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            optional: false,
            description: 'Configure JWT authentication on your Zep instance (Optional)',
            credentialNames: ['zepMemoryApi']
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
                label: 'Zep Collection',
                name: 'zepCollection',
                type: 'string',
                placeholder: 'my-first-collection'
            },
            {
                label: 'Zep Metadata Filter',
                name: 'zepMetadataFilter',
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
                label: 'Zep Retriever',
                name: 'retriever',
                baseClasses: this.baseClasses
            },
            {
                label: 'Zep Vector Store',
                name: 'vectorStore',
                baseClasses: [this.type, ...(0, utils_1.getBaseClasses)(zep_cloud_2.ZepCloudVectorStore)]
            }
        ]
    }
    async init(nodeData, _, options) {
        const zepCollection = nodeData.inputs?.zepCollection
        const zepMetadataFilter = nodeData.inputs?.zepMetadataFilter
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options)
        const apiKey = (0, utils_1.getCredentialParam)('apiKey', credentialData, nodeData)
        const zepConfig = {
            apiKey,
            collectionName: zepCollection
        }
        if (zepMetadataFilter) {
            zepConfig.filter = typeof zepMetadataFilter === 'object' ? zepMetadataFilter : (0, utils_1.parseJsonBody)(zepMetadataFilter)
        }
        zepConfig.client = new zep_cloud_1.ZepClient({
            apiKey: apiKey
        })
        const vectorStore = await ZepExistingVS.init(zepConfig)
        return (0, VectorStoreUtils_1.resolveVectorStoreOrRetriever)(nodeData, vectorStore, zepConfig.filter)
    }
}
class ZepExistingVS extends zep_cloud_2.ZepCloudVectorStore {
    constructor(embeddings, args) {
        super(embeddings, args)
        this.filter = args.filter
        this.args = args
    }
    static async fromExistingIndex(embeddings, dbConfig) {
        return new this(embeddings, dbConfig)
    }
}
module.exports = { nodeClass: Zep_CloudVectorStores }
//# sourceMappingURL=ZepCloud.js.map
