"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const opensearch_1 = require("@opensearch-project/opensearch");
const documents_1 = require("@langchain/core/documents");
const opensearch_2 = require("@langchain/community/vectorstores/opensearch");
const utils_1 = require("../../../src/utils");
class OpenSearch_VectorStores {
    constructor() {
        //@ts-ignore
        this.vectorStoreMethods = {
            async upsert(nodeData, options) {
                const docs = nodeData.inputs?.document;
                const embeddings = nodeData.inputs?.embeddings;
                const indexName = nodeData.inputs?.indexName;
                const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
                const opensearchURL = (0, utils_1.getCredentialParam)('openSearchUrl', credentialData, nodeData);
                const user = (0, utils_1.getCredentialParam)('user', credentialData, nodeData);
                const password = (0, utils_1.getCredentialParam)('password', credentialData, nodeData);
                const client = getOpenSearchClient(opensearchURL, user, password);
                const flattenDocs = docs && docs.length ? (0, lodash_1.flatten)(docs) : [];
                const finalDocs = [];
                for (let i = 0; i < flattenDocs.length; i += 1) {
                    if (flattenDocs[i] && flattenDocs[i].pageContent) {
                        finalDocs.push(new documents_1.Document(flattenDocs[i]));
                    }
                }
                try {
                    await opensearch_2.OpenSearchVectorStore.fromDocuments(finalDocs, embeddings, {
                        client,
                        indexName: indexName,
                        vectorSearchOptions: getVectorSearchOptions(nodeData)
                    });
                    return { numAdded: finalDocs.length, addedDocs: finalDocs };
                }
                catch (e) {
                    throw new Error(e);
                }
            }
        };
        this.label = 'OpenSearch';
        this.name = 'openSearch';
        this.version = 4.0;
        this.type = 'OpenSearch';
        this.icon = 'opensearch.svg';
        this.category = 'Vector Stores';
        this.description = `Upsert embedded data and perform similarity search upon query using OpenSearch, an open-source, all-in-one vector database`;
        this.baseClasses = [this.type, 'VectorStoreRetriever', 'BaseRetriever'];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['openSearchUrl']
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
                label: 'Index Name',
                name: 'indexName',
                type: 'string'
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
                label: 'Engine',
                name: 'engine',
                type: 'options',
                description: 'Vector search engine. Use "lucene" or "faiss" for OpenSearch 3.x+, "nmslib" for older versions',
                options: [
                    { label: 'Lucene (OpenSearch 2.x+)', name: 'lucene' },
                    { label: 'Faiss (OpenSearch 2.x+)', name: 'faiss' },
                    { label: 'NMSLIB (Legacy, pre-3.0)', name: 'nmslib' }
                ],
                default: 'lucene',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Space Type',
                name: 'spaceType',
                type: 'options',
                description: 'Distance metric for similarity search',
                options: [
                    { label: 'L2 (Euclidean)', name: 'l2' },
                    { label: 'Cosine Similarity', name: 'cosinesimil' },
                    { label: 'Inner Product', name: 'innerproduct' }
                ],
                default: 'l2',
                additionalParams: true,
                optional: true
            }
        ];
        this.outputs = [
            {
                label: 'OpenSearch Retriever',
                name: 'retriever',
                baseClasses: this.baseClasses
            },
            {
                label: 'OpenSearch Vector Store',
                name: 'vectorStore',
                baseClasses: [this.type, ...(0, utils_1.getBaseClasses)(opensearch_2.OpenSearchVectorStore)]
            }
        ];
    }
    async init(nodeData, _, options) {
        const embeddings = nodeData.inputs?.embeddings;
        const indexName = nodeData.inputs?.indexName;
        const output = nodeData.outputs?.output;
        const topK = nodeData.inputs?.topK;
        const k = topK ? parseFloat(topK) : 4;
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
        const opensearchURL = (0, utils_1.getCredentialParam)('openSearchUrl', credentialData, nodeData);
        const user = (0, utils_1.getCredentialParam)('user', credentialData, nodeData);
        const password = (0, utils_1.getCredentialParam)('password', credentialData, nodeData);
        const client = getOpenSearchClient(opensearchURL, user, password);
        const vectorStore = new opensearch_2.OpenSearchVectorStore(embeddings, {
            client,
            indexName,
            vectorSearchOptions: getVectorSearchOptions(nodeData)
        });
        if (output === 'retriever') {
            const retriever = vectorStore.asRetriever(k);
            return retriever;
        }
        else if (output === 'vectorStore') {
            ;
            vectorStore.k = k;
            return vectorStore;
        }
        return vectorStore;
    }
}
const getVectorSearchOptions = (nodeData) => {
    const engine = nodeData.inputs?.engine || 'lucene';
    const spaceType = nodeData.inputs?.spaceType || 'l2';
    // TODO: Remove 'as any' casts when @langchain/community updates OpenSearchEngine types
    // to include 'lucene' and 'faiss' as valid engines (currently only has 'nmslib' | 'hnsw').
    return {
        engine: engine,
        spaceType: spaceType
    };
};
const getOpenSearchClient = (url, user, password) => {
    if (user && password) {
        const urlObj = new URL(url);
        urlObj.username = user;
        urlObj.password = password;
        url = urlObj.toString();
    }
    return new opensearch_1.Client({
        nodes: [url]
    });
};
module.exports = { nodeClass: OpenSearch_VectorStores };
//# sourceMappingURL=OpenSearch.js.map