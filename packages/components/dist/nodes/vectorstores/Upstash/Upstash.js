"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const utils_1 = require("../../../src/utils");
const documents_1 = require("@langchain/core/documents");
const upstash_1 = require("@langchain/community/vectorstores/upstash");
const vector_1 = require("@upstash/vector");
const indexing_1 = require("../../../src/indexing");
const VectorStoreUtils_1 = require("../VectorStoreUtils");
class Upstash_VectorStores {
    constructor() {
        //@ts-ignore
        this.vectorStoreMethods = {
            async upsert(nodeData, options) {
                const docs = nodeData.inputs?.document;
                const embeddings = nodeData.inputs?.embeddings;
                const recordManager = nodeData.inputs?.recordManager;
                const isFileUploadEnabled = nodeData.inputs?.fileUpload;
                const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
                const UPSTASH_VECTOR_REST_URL = (0, utils_1.getCredentialParam)('UPSTASH_VECTOR_REST_URL', credentialData, nodeData);
                const UPSTASH_VECTOR_REST_TOKEN = (0, utils_1.getCredentialParam)('UPSTASH_VECTOR_REST_TOKEN', credentialData, nodeData);
                const upstashIndex = new vector_1.Index({
                    url: UPSTASH_VECTOR_REST_URL,
                    token: UPSTASH_VECTOR_REST_TOKEN
                });
                const flattenDocs = docs && docs.length ? (0, lodash_1.flatten)(docs) : [];
                const finalDocs = [];
                for (let i = 0; i < flattenDocs.length; i += 1) {
                    if (flattenDocs[i] && flattenDocs[i].pageContent) {
                        if (isFileUploadEnabled && options.chatId) {
                            flattenDocs[i].metadata = { ...flattenDocs[i].metadata, [utils_1.FLOWISE_CHATID]: options.chatId };
                        }
                        finalDocs.push(new documents_1.Document(flattenDocs[i]));
                    }
                }
                const obj = {
                    index: upstashIndex
                };
                try {
                    if (recordManager) {
                        const vectorStore = await upstash_1.UpstashVectorStore.fromExistingIndex(embeddings, obj);
                        await recordManager.createSchema();
                        const res = await (0, indexing_1.index)({
                            docsSource: finalDocs,
                            recordManager,
                            vectorStore,
                            options: {
                                cleanup: recordManager?.cleanup,
                                sourceIdKey: recordManager?.sourceIdKey ?? 'source',
                                vectorStoreName: UPSTASH_VECTOR_REST_URL
                            }
                        });
                        return res;
                    }
                    else {
                        await upstash_1.UpstashVectorStore.fromDocuments(finalDocs, embeddings, obj);
                        return { numAdded: finalDocs.length, addedDocs: finalDocs };
                    }
                }
                catch (e) {
                    throw new Error(e);
                }
            },
            async delete(nodeData, ids, options) {
                const embeddings = nodeData.inputs?.embeddings;
                const recordManager = nodeData.inputs?.recordManager;
                const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
                const UPSTASH_VECTOR_REST_URL = (0, utils_1.getCredentialParam)('UPSTASH_VECTOR_REST_URL', credentialData, nodeData);
                const UPSTASH_VECTOR_REST_TOKEN = (0, utils_1.getCredentialParam)('UPSTASH_VECTOR_REST_TOKEN', credentialData, nodeData);
                const upstashIndex = new vector_1.Index({
                    url: UPSTASH_VECTOR_REST_URL,
                    token: UPSTASH_VECTOR_REST_TOKEN
                });
                const obj = {
                    index: upstashIndex
                };
                const upstashStore = new upstash_1.UpstashVectorStore(embeddings, obj);
                try {
                    if (recordManager) {
                        const vectorStoreName = UPSTASH_VECTOR_REST_URL;
                        await recordManager.createSchema();
                        recordManager.namespace = recordManager.namespace + '_' + vectorStoreName;
                        const filterKeys = {};
                        if (options.docId) {
                            filterKeys.docId = options.docId;
                        }
                        const keys = await recordManager.listKeys(filterKeys);
                        await upstashStore.delete({ ids: keys });
                        await recordManager.deleteKeys(keys);
                    }
                    else {
                        await upstashStore.delete({ ids });
                    }
                }
                catch (e) {
                    throw new Error(e);
                }
            }
        };
        this.label = 'Upstash Vector';
        this.name = 'upstash';
        this.version = 2.0;
        this.type = 'Upstash';
        this.icon = 'upstash.svg';
        this.category = 'Vector Stores';
        this.description =
            'Upsert data as embedding or string and perform similarity search with Upstash, the leading serverless data platform';
        this.baseClasses = [this.type, 'VectorStoreRetriever', 'BaseRetriever'];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            description: 'Necessary credentials for the HTTP connection',
            credentialNames: ['upstashVectorApi']
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
                label: 'Upstash Metadata Filter',
                name: 'upstashMetadataFilter',
                type: 'string',
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
                label: 'Upstash Retriever',
                name: 'retriever',
                baseClasses: this.baseClasses
            },
            {
                label: 'Upstash Vector Store',
                name: 'vectorStore',
                baseClasses: [this.type, ...(0, utils_1.getBaseClasses)(upstash_1.UpstashVectorStore)]
            }
        ];
    }
    async init(nodeData, _, options) {
        const upstashMetadataFilter = nodeData.inputs?.upstashMetadataFilter;
        const embeddings = nodeData.inputs?.embeddings;
        const isFileUploadEnabled = nodeData.inputs?.fileUpload;
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
        const UPSTASH_VECTOR_REST_URL = (0, utils_1.getCredentialParam)('UPSTASH_VECTOR_REST_URL', credentialData, nodeData);
        const UPSTASH_VECTOR_REST_TOKEN = (0, utils_1.getCredentialParam)('UPSTASH_VECTOR_REST_TOKEN', credentialData, nodeData);
        const upstashIndex = new vector_1.Index({
            url: UPSTASH_VECTOR_REST_URL,
            token: UPSTASH_VECTOR_REST_TOKEN
        });
        const obj = {
            index: upstashIndex
        };
        if (upstashMetadataFilter) {
            obj.filter = upstashMetadataFilter;
        }
        if (isFileUploadEnabled && options.chatId) {
            if (upstashMetadataFilter)
                obj.filter += ` OR ${utils_1.FLOWISE_CHATID} = "${options.chatId}" OR HAS NOT FIELD ${utils_1.FLOWISE_CHATID}`;
            else
                obj.filter = `${utils_1.FLOWISE_CHATID} = "${options.chatId}" OR HAS NOT FIELD ${utils_1.FLOWISE_CHATID}`;
        }
        const vectorStore = await upstash_1.UpstashVectorStore.fromExistingIndex(embeddings, obj);
        return (0, VectorStoreUtils_1.resolveVectorStoreOrRetriever)(nodeData, vectorStore, obj.filter);
    }
}
module.exports = { nodeClass: Upstash_VectorStores };
//# sourceMappingURL=Upstash.js.map