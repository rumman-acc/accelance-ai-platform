"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const documents_1 = require("@langchain/core/documents");
const utils_1 = require("../../../src/utils");
const core_1 = require("./core");
const indexing_1 = require("../../../src/indexing");
class Chroma_VectorStores {
    constructor() {
        //@ts-ignore
        this.vectorStoreMethods = {
            async upsert(nodeData, options) {
                const collectionName = nodeData.inputs?.collectionName;
                const docs = nodeData.inputs?.document;
                const embeddings = nodeData.inputs?.embeddings;
                const chromaURL = nodeData.inputs?.chromaURL;
                const recordManager = nodeData.inputs?.recordManager;
                const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
                const chromaApiKey = (0, utils_1.getCredentialParam)('chromaApiKey', credentialData, nodeData);
                const chromaTenant = (0, utils_1.getCredentialParam)('chromaTenant', credentialData, nodeData);
                const chromaDatabase = (0, utils_1.getCredentialParam)('chromaDatabase', credentialData, nodeData);
                const flattenDocs = docs && docs.length ? (0, lodash_1.flatten)(docs) : [];
                const finalDocs = [];
                for (let i = 0; i < flattenDocs.length; i += 1) {
                    if (flattenDocs[i] && flattenDocs[i].pageContent) {
                        finalDocs.push(new documents_1.Document(flattenDocs[i]));
                    }
                }
                const obj = _buildChromaConfig(collectionName, chromaURL, chromaApiKey, chromaTenant, chromaDatabase);
                try {
                    if (recordManager) {
                        const vectorStore = await core_1.Chroma.fromExistingCollection(embeddings, obj);
                        await recordManager.createSchema();
                        const res = await (0, indexing_1.index)({
                            docsSource: finalDocs,
                            recordManager,
                            vectorStore,
                            options: {
                                cleanup: recordManager?.cleanup,
                                sourceIdKey: recordManager?.sourceIdKey ?? 'source',
                                vectorStoreName: collectionName
                            }
                        });
                        return res;
                    }
                    else {
                        await core_1.Chroma.fromDocuments(finalDocs, embeddings, obj);
                        return { numAdded: finalDocs.length, addedDocs: finalDocs };
                    }
                }
                catch (e) {
                    throw new Error(e);
                }
            },
            async delete(nodeData, ids, options) {
                const collectionName = nodeData.inputs?.collectionName;
                const embeddings = nodeData.inputs?.embeddings;
                const chromaURL = nodeData.inputs?.chromaURL;
                const recordManager = nodeData.inputs?.recordManager;
                const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
                const chromaApiKey = (0, utils_1.getCredentialParam)('chromaApiKey', credentialData, nodeData);
                const chromaTenant = (0, utils_1.getCredentialParam)('chromaTenant', credentialData, nodeData);
                const chromaDatabase = (0, utils_1.getCredentialParam)('chromaDatabase', credentialData, nodeData);
                const obj = _buildChromaConfig(collectionName, chromaURL, chromaApiKey, chromaTenant, chromaDatabase);
                try {
                    if (recordManager) {
                        const vectorStoreName = collectionName;
                        await recordManager.createSchema();
                        recordManager.namespace = recordManager.namespace + '_' + vectorStoreName;
                        const filterKeys = {};
                        if (options.docId) {
                            filterKeys.docId = options.docId;
                        }
                        const keys = await recordManager.listKeys(filterKeys);
                        const chromaStore = new core_1.Chroma(embeddings, obj);
                        await chromaStore.delete({ ids: keys });
                        await recordManager.deleteKeys(keys);
                    }
                    else {
                        const chromaStore = new core_1.Chroma(embeddings, obj);
                        await chromaStore.delete({ ids });
                    }
                }
                catch (e) {
                    throw new Error(e);
                }
            }
        };
        this.label = 'Chroma';
        this.name = 'chroma';
        this.version = 2.0;
        this.type = 'Chroma';
        this.icon = 'chroma.svg';
        this.category = 'Vector Stores';
        this.description = 'Upsert embedded data and perform similarity search upon query using Chroma, an open-source embedding database';
        this.baseClasses = [this.type, 'VectorStoreRetriever', 'BaseRetriever'];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            description: 'Only needed if you have chroma on cloud services with X-Api-key',
            optional: true,
            credentialNames: ['chromaApi']
        };
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
                label: 'Collection Name',
                name: 'collectionName',
                type: 'string'
            },
            {
                label: 'Chroma URL',
                name: 'chromaURL',
                type: 'string',
                optional: true
            },
            {
                label: 'Chroma Metadata Filter',
                name: 'chromaMetadataFilter',
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
        ];
        this.outputs = [
            {
                label: 'Chroma Retriever',
                name: 'retriever',
                baseClasses: this.baseClasses
            },
            {
                label: 'Chroma Vector Store',
                name: 'vectorStore',
                baseClasses: [this.type, ...(0, utils_1.getBaseClasses)(core_1.Chroma)]
            }
        ];
    }
    async init(nodeData, _, options) {
        const collectionName = nodeData.inputs?.collectionName;
        const embeddings = nodeData.inputs?.embeddings;
        const chromaURL = nodeData.inputs?.chromaURL;
        const output = nodeData.outputs?.output;
        const topK = nodeData.inputs?.topK;
        const k = topK ? parseFloat(topK) : 4;
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
        const chromaApiKey = (0, utils_1.getCredentialParam)('chromaApiKey', credentialData, nodeData);
        const chromaTenant = (0, utils_1.getCredentialParam)('chromaTenant', credentialData, nodeData);
        const chromaDatabase = (0, utils_1.getCredentialParam)('chromaDatabase', credentialData, nodeData);
        const chromaMetadataFilter = nodeData.inputs?.chromaMetadataFilter;
        const obj = _buildChromaConfig(collectionName, chromaURL, chromaApiKey, chromaTenant, chromaDatabase);
        if (chromaMetadataFilter) {
            const metadatafilter = typeof chromaMetadataFilter === 'object' ? chromaMetadataFilter : (0, utils_1.parseJsonBody)(chromaMetadataFilter);
            obj.filter = metadatafilter;
        }
        const vectorStore = await core_1.Chroma.fromExistingCollection(embeddings, obj);
        if (output === 'retriever') {
            const retriever = vectorStore.asRetriever(k);
            return retriever;
        }
        else if (output === 'vectorStore') {
            ;
            vectorStore.k = k;
            if (chromaMetadataFilter) {
                ;
                vectorStore.filter = obj.filter;
            }
            return vectorStore;
        }
        return vectorStore;
    }
}
const _buildChromaConfig = (collectionName, chromaURL, chromaApiKey, chromaTenant, chromaDatabase) => {
    const obj = { collectionName };
    if (chromaURL)
        obj.url = chromaURL;
    if (chromaApiKey)
        obj.chromaCloudAPIKey = chromaApiKey;
    if (chromaTenant || chromaDatabase) {
        obj.clientParams = {};
        if (chromaTenant)
            obj.clientParams.tenant = chromaTenant;
        if (chromaDatabase)
            obj.clientParams.database = chromaDatabase;
        if (chromaApiKey) {
            obj.clientParams.host = 'api.trychroma.com';
            obj.clientParams.port = 8000;
            obj.clientParams.ssl = true;
        }
    }
    return obj;
};
module.exports = { nodeClass: Chroma_VectorStores };
//# sourceMappingURL=Chroma.js.map