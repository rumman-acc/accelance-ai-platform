'use strict'
var __importDefault =
    (this && this.__importDefault) ||
    function (mod) {
        return mod && mod.__esModule ? mod : { default: mod }
    }
Object.defineProperty(exports, '__esModule', { value: true })
exports.parseHostPort = parseHostPort
const lodash_1 = require('lodash')
const weaviate_client_1 = __importDefault(require('weaviate-client'))
const weaviate_1 = require('@langchain/weaviate')
const documents_1 = require('@langchain/core/documents')
const utils_1 = require('../../../src/utils')
const VectorStoreUtils_1 = require('../VectorStoreUtils')
const indexing_1 = require('../../../src/indexing')
/**
 * Parses a host string into host and optional port.
 * Handles IPv6 bracket notation (e.g. "[::1]:8080") and plain "host:port".
 */
function parseHostPort(host) {
    const ipv6Match = host.match(/^\[([^\]]+)\](?::(\d+))?$/)
    if (ipv6Match) {
        const port = ipv6Match[2] ? parseInt(ipv6Match[2], 10) : undefined
        return { host: ipv6Match[1], port: isNaN(port) ? undefined : port }
    }
    const lastColon = host.lastIndexOf(':')
    if (lastColon > 0) {
        const maybePart = host.substring(lastColon + 1)
        const port = parseInt(maybePart, 10)
        if (!isNaN(port) && String(port) === maybePart) {
            return { host: host.substring(0, lastColon), port }
        }
    }
    return { host }
}
async function createWeaviateClient(weaviateConnectionType, rawHost, httpSecure, rawGrpcHost, grpcSecure, apiKey) {
    if (weaviateConnectionType === 'cloud') {
        if (!apiKey) {
            throw new Error('API key is required for cloud connection')
        }
        return weaviate_client_1.default.connectToWeaviateCloud(rawHost, {
            authCredentials: new weaviate_client_1.default.ApiKey(apiKey)
        })
    }
    const { host: extractedHttpHost, port: extractedHttpPort } = parseHostPort(rawHost)
    const { host: extractedGrpcHost, port: extractedGrpcPort } = parseHostPort(rawGrpcHost ?? '')
    if (weaviateConnectionType === 'local') {
        const options = {
            host: extractedHttpHost,
            port: extractedHttpPort,
            grpcPort: extractedGrpcPort,
            authCredentials: apiKey ? new weaviate_client_1.default.ApiKey(apiKey) : undefined
        }
        return weaviate_client_1.default.connectToLocal(options)
    }
    const httpHost = extractedHttpHost
    const httpPort = extractedHttpPort ?? 8080
    const grpcHost = extractedGrpcHost
    const grpcPort = extractedGrpcPort ?? 50051
    const options = {
        httpHost,
        httpPort,
        httpSecure,
        grpcHost,
        grpcPort,
        grpcSecure,
        authCredentials: apiKey ? new weaviate_client_1.default.ApiKey(apiKey) : undefined
    }
    return weaviate_client_1.default.connectToCustom(options)
}
class Weaviate_VectorStores {
    constructor() {
        //@ts-ignore
        this.vectorStoreMethods = {
            async upsert(nodeData, options) {
                const weaviateHost = nodeData.inputs?.weaviateHost
                const weaviateGrpcHost = nodeData.inputs?.weaviateGrpcHost
                const weaviateHttpSecure = nodeData.inputs?.weaviateHttpSecure
                const weaviateGrpcSecure = nodeData.inputs?.weaviateGrpcSecure
                const weaviateConnectionType = nodeData.inputs?.weaviateConnectionType
                const weaviateIndex = nodeData.inputs?.weaviateIndex
                const weaviateTextKey = nodeData.inputs?.weaviateTextKey
                const weaviateMetadataKeys = nodeData.inputs?.weaviateMetadataKeys
                const docs = nodeData.inputs?.document
                const embeddings = nodeData.inputs?.embeddings
                const recordManager = nodeData.inputs?.recordManager
                const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options)
                const weaviateApiKey = (0, utils_1.getCredentialParam)('weaviateApiKey', credentialData, nodeData)
                const client = await createWeaviateClient(
                    weaviateConnectionType,
                    weaviateHost,
                    weaviateHttpSecure,
                    weaviateGrpcHost,
                    weaviateGrpcSecure,
                    weaviateApiKey
                )
                const flattenDocs = docs && docs.length ? (0, lodash_1.flatten)(docs) : []
                const finalDocs = []
                for (let i = 0; i < flattenDocs.length; i += 1) {
                    if (flattenDocs[i] && flattenDocs[i].pageContent) {
                        const doc = { ...flattenDocs[i] }
                        if (doc.metadata) {
                            doc.metadata = (0, utils_1.normalizeKeysRecursively)(doc.metadata)
                        }
                        finalDocs.push(new documents_1.Document(doc))
                    }
                }
                const obj = {
                    //@ts-ignore
                    client,
                    indexName: weaviateIndex
                }
                if (weaviateTextKey) obj.textKey = weaviateTextKey
                if (weaviateMetadataKeys) obj.metadataKeys = JSON.parse(weaviateMetadataKeys.replace(/\s/g, ''))
                try {
                    if (recordManager) {
                        const vectorStore = await weaviate_1.WeaviateStore.fromExistingIndex(embeddings, obj)
                        await recordManager.createSchema()
                        const res = await (0, indexing_1.index)({
                            docsSource: finalDocs,
                            recordManager,
                            vectorStore,
                            options: {
                                cleanup: recordManager?.cleanup,
                                sourceIdKey: recordManager?.sourceIdKey ?? 'source',
                                vectorStoreName: weaviateTextKey ? weaviateIndex + '_' + weaviateTextKey : weaviateIndex
                            }
                        })
                        return res
                    } else {
                        await weaviate_1.WeaviateStore.fromDocuments(finalDocs, embeddings, obj)
                        return { numAdded: finalDocs.length, addedDocs: finalDocs }
                    }
                } catch (e) {
                    throw new Error(e)
                }
            },
            async delete(nodeData, ids, options) {
                const weaviateHost = nodeData.inputs?.weaviateHost
                const weaviateGrpcHost = nodeData.inputs?.weaviateGrpcHost
                const weaviateHttpSecure = nodeData.inputs?.weaviateHttpSecure
                const weaviateGrpcSecure = nodeData.inputs?.weaviateGrpcSecure
                const weaviateConnectionType = nodeData.inputs?.weaviateConnectionType
                const weaviateIndex = nodeData.inputs?.weaviateIndex
                const weaviateTextKey = nodeData.inputs?.weaviateTextKey
                const weaviateMetadataKeys = nodeData.inputs?.weaviateMetadataKeys
                const embeddings = nodeData.inputs?.embeddings
                const recordManager = nodeData.inputs?.recordManager
                const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options)
                const weaviateApiKey = (0, utils_1.getCredentialParam)('weaviateApiKey', credentialData, nodeData)
                const client = await createWeaviateClient(
                    weaviateConnectionType,
                    weaviateHost,
                    weaviateHttpSecure,
                    weaviateGrpcHost,
                    weaviateGrpcSecure,
                    weaviateApiKey
                )
                const obj = {
                    //@ts-ignore
                    client,
                    indexName: weaviateIndex
                }
                if (weaviateTextKey) obj.textKey = weaviateTextKey
                if (weaviateMetadataKeys) obj.metadataKeys = JSON.parse(weaviateMetadataKeys.replace(/\s/g, ''))
                const weaviateStore = new weaviate_1.WeaviateStore(embeddings, obj)
                try {
                    if (recordManager) {
                        const vectorStoreName = weaviateTextKey ? weaviateIndex + '_' + weaviateTextKey : weaviateIndex
                        await recordManager.createSchema()
                        recordManager.namespace = recordManager.namespace + '_' + vectorStoreName
                        const filterKeys = {}
                        if (options.docId) {
                            filterKeys.docId = options.docId
                        }
                        const keys = await recordManager.listKeys(filterKeys)
                        await weaviateStore.delete({ ids: keys })
                        await recordManager.deleteKeys(keys)
                    } else {
                        await weaviateStore.delete({ ids })
                    }
                } catch (e) {
                    throw new Error(e)
                }
            }
        }
        this.label = 'Weaviate'
        this.name = 'weaviate'
        this.version = 5.0
        this.type = 'Weaviate'
        this.icon = 'weaviate.png'
        this.category = 'Vector Stores'
        this.description =
            'Upsert embedded data and perform similarity or mmr search using Weaviate, a scalable open-source vector database'
        this.baseClasses = [this.type, 'VectorStoreRetriever', 'BaseRetriever']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            description: 'Only needed when using Weaviate cloud hosted',
            optional: true,
            credentialNames: ['weaviateApi']
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
                label: 'Record Manager',
                name: 'recordManager',
                type: 'RecordManager',
                description: 'Keep track of the record to prevent duplication',
                optional: true
            },
            {
                label: 'Weaviate Connection Type',
                name: 'weaviateConnectionType',
                type: 'options',
                options: [
                    {
                        label: 'Cloud',
                        name: 'cloud'
                    },
                    {
                        label: 'Local',
                        name: 'local'
                    },
                    {
                        label: 'Custom',
                        name: 'custom'
                    }
                ],
                default: 'cloud'
            },
            {
                label: 'Weaviate Host/URL',
                name: 'weaviateHost',
                type: 'string',
                placeholder: 'localhost:8080',
                description: 'The host/URL to connect to the Weaviate server. Use REST Endpoint for cloud connection.'
            },
            {
                label: 'HTTP Secure',
                name: 'weaviateHttpSecure',
                type: 'boolean',
                default: true,
                additionalParams: true,
                optional: true,
                show: {
                    weaviateConnectionType: 'custom'
                }
            },
            {
                label: 'GRPC Host/URL',
                name: 'weaviateGrpcHost',
                type: 'string',
                placeholder: 'localhost:50051',
                additionalParams: true,
                optional: true,
                show: {
                    weaviateConnectionType: 'custom'
                }
            },
            {
                label: 'GRPC Secure',
                name: 'weaviateGrpcSecure',
                type: 'boolean',
                default: true,
                additionalParams: true,
                optional: true,
                show: {
                    weaviateConnectionType: 'custom'
                }
            },
            {
                label: 'Weaviate Index',
                name: 'weaviateIndex',
                type: 'string',
                placeholder: 'Test',
                description: 'The collection name to use. Must start with capital letter.'
            },
            {
                label: 'Weaviate Text Key',
                name: 'weaviateTextKey',
                type: 'string',
                placeholder: 'text',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Weaviate Metadata Keys',
                name: 'weaviateMetadataKeys',
                type: 'string',
                rows: 4,
                placeholder: `["foo"]`,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Top K',
                name: 'topK',
                description: 'Number of top results to fetch. Default to 4',
                placeholder: '4',
                type: 'number',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Weaviate Search Filter',
                name: 'weaviateFilter',
                type: 'json',
                additionalParams: true,
                optional: true,
                acceptVariable: true
            }
        ]
        ;(0, VectorStoreUtils_1.addMMRInputParams)(this.inputs)
        this.inputs.push({
            label: 'Alpha (for Hybrid Search)',
            name: 'alpha',
            description:
                'Number between 0 and 1 that determines the weighting of keyword (BM25) portion of the hybrid search. A value of 1 is a pure vector search, while 0 is a pure keyword search.',
            placeholder: '1',
            type: 'number',
            additionalParams: true,
            optional: true
        })
        this.outputs = [
            {
                label: 'Weaviate Retriever',
                name: 'retriever',
                baseClasses: this.baseClasses
            },
            {
                label: 'Weaviate Vector Store',
                name: 'vectorStore',
                baseClasses: [this.type, ...(0, utils_1.getBaseClasses)(weaviate_1.WeaviateStore)]
            }
        ]
    }
    async init(nodeData, _, options) {
        const weaviateHost = nodeData.inputs?.weaviateHost
        const weaviateGrpcHost = nodeData.inputs?.weaviateGrpcHost
        const weaviateHttpSecure = nodeData.inputs?.weaviateHttpSecure
        const weaviateGrpcSecure = nodeData.inputs?.weaviateGrpcSecure
        const weaviateConnectionType = nodeData.inputs?.weaviateConnectionType
        const weaviateIndex = nodeData.inputs?.weaviateIndex
        const weaviateTextKey = nodeData.inputs?.weaviateTextKey
        const weaviateMetadataKeys = nodeData.inputs?.weaviateMetadataKeys
        const embeddings = nodeData.inputs?.embeddings
        let weaviateFilter = nodeData.inputs?.weaviateFilter
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options)
        const weaviateApiKey = (0, utils_1.getCredentialParam)('weaviateApiKey', credentialData, nodeData)
        const client = await createWeaviateClient(
            weaviateConnectionType,
            weaviateHost,
            weaviateHttpSecure,
            weaviateGrpcHost,
            weaviateGrpcSecure,
            weaviateApiKey
        )
        const obj = {
            //@ts-ignore
            client,
            indexName: weaviateIndex
        }
        if (weaviateTextKey) obj.textKey = weaviateTextKey
        if (weaviateMetadataKeys) obj.metadataKeys = JSON.parse(weaviateMetadataKeys.replace(/\s/g, ''))
        if (weaviateFilter) {
            weaviateFilter = typeof weaviateFilter === 'object' ? weaviateFilter : (0, utils_1.parseJsonBody)(weaviateFilter)
        }
        const vectorStore = await weaviate_1.WeaviateStore.fromExistingIndex(embeddings, obj)
        return (0, VectorStoreUtils_1.resolveVectorStoreOrRetriever)(nodeData, vectorStore, weaviateFilter)
    }
}
module.exports = { nodeClass: Weaviate_VectorStores }
//# sourceMappingURL=Weaviate.js.map
