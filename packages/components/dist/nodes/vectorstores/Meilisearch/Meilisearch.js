"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const src_1 = require("../../../src");
const meilisearch_1 = require("meilisearch");
const core_1 = require("./core");
const lodash_1 = require("lodash");
const uuid_1 = require("uuid");
class MeilisearchRetriever_node {
    constructor() {
        //@ts-ignore
        this.vectorStoreMethods = {
            async upsert(nodeData, options) {
                const credentialData = await (0, src_1.getCredentialData)(nodeData.credential ?? '', options);
                const meilisearchAdminApiKey = (0, src_1.getCredentialParam)('meilisearchAdminApiKey', credentialData, nodeData);
                const docs = nodeData.inputs?.document;
                const host = nodeData.inputs?.host;
                const indexUid = nodeData.inputs?.indexUid;
                const deleteIndex = nodeData.inputs?.deleteIndex;
                const embeddings = nodeData.inputs?.embeddings;
                let embeddingDimension = 384;
                const client = new meilisearch_1.Meilisearch({
                    host: host,
                    apiKey: meilisearchAdminApiKey
                });
                const flattenDocs = docs && docs.length ? (0, lodash_1.flatten)(docs) : [];
                const finalDocs = [];
                for (let i = 0; i < flattenDocs.length; i += 1) {
                    if (flattenDocs[i] && flattenDocs[i].pageContent) {
                        const uniqueId = (0, uuid_1.v4)();
                        const { pageContent, metadata } = flattenDocs[i];
                        const docEmbedding = await embeddings.embedQuery(pageContent);
                        embeddingDimension = docEmbedding.length;
                        const documentForIndexing = {
                            pageContent,
                            metadata,
                            objectID: uniqueId,
                            _vectors: {
                                ollama: {
                                    embeddings: docEmbedding,
                                    regenerate: false
                                }
                            }
                        };
                        finalDocs.push(documentForIndexing);
                    }
                }
                let taskUid_created = 0;
                if (deleteIndex) {
                    try {
                        const deleteResponse = await client.deleteIndex(indexUid);
                        taskUid_created = deleteResponse.taskUid;
                        let deleteTaskStatus = await client.getTask(taskUid_created);
                        while (deleteTaskStatus.status !== 'succeeded') {
                            deleteTaskStatus = await client.getTask(taskUid_created);
                            if (deleteTaskStatus.error !== null || deleteTaskStatus.status === 'failed') {
                                throw new Error('Error during index deletion task: ' + deleteTaskStatus.error);
                            }
                        }
                    }
                    catch (error) {
                        console.error(error);
                        console.warn('Error occurred when deleting your index, if it did not exist, we will create one for you... ');
                    }
                }
                let index;
                try {
                    index = await client.getIndex(indexUid);
                }
                catch (error) {
                    console.warn('Index not found, creating a new index...');
                    try {
                        const createResponse = await client.createIndex(indexUid, { primaryKey: 'objectID' });
                        taskUid_created = createResponse.taskUid;
                        let createTaskStatus = await client.getTask(taskUid_created);
                        while (createTaskStatus.status !== 'succeeded') {
                            createTaskStatus = await client.getTask(taskUid_created);
                            if (createTaskStatus.error !== null || createTaskStatus.status === 'failed') {
                                throw new Error('Error during index creation task: ' + createTaskStatus.error);
                            }
                        }
                        index = await client.getIndex(indexUid);
                    }
                    catch (taskError) {
                        console.error('Error during index creation process:', taskError);
                    }
                }
                try {
                    await index.updateFilterableAttributes(['metadata']);
                    await index.updateSettings({
                        embedders: {
                            ollama: {
                                source: 'userProvided',
                                dimensions: embeddingDimension
                            }
                        }
                    });
                    const addResponse = await index.addDocuments(finalDocs);
                    taskUid_created = addResponse.taskUid;
                    let AddTaskStatus = await client.getTask(taskUid_created);
                    while (AddTaskStatus.status !== 'succeeded') {
                        AddTaskStatus = await client.getTask(taskUid_created);
                        if (AddTaskStatus.error !== null || AddTaskStatus.status === 'failed') {
                            throw new Error('Error during documents adding task: ' + AddTaskStatus.error);
                        }
                    }
                    index = await client.getIndex(indexUid);
                }
                catch (error) {
                    console.error('Error occurred while adding documents:', error);
                }
                return { numAdded: finalDocs.length, addedDocs: finalDocs };
            }
        };
        this.label = 'Meilisearch';
        this.name = 'meilisearch';
        this.version = 1.0;
        this.type = 'Meilisearch';
        this.icon = 'Meilisearch.png';
        this.category = 'Vector Stores';
        this.description = `Upsert embedded data and perform similarity search upon query using Meilisearch hybrid search functionality`;
        this.baseClasses = ['BaseRetriever'];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['meilisearchApi']
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
                label: 'Host',
                name: 'host',
                type: 'string',
                description: "This is the URL for the desired Meilisearch instance, the URL must not end with a '/'"
            },
            {
                label: 'Index Uid',
                name: 'indexUid',
                type: 'string',
                description: 'UID for the index to answer from'
            },
            {
                label: 'Delete Index if exists',
                name: 'deleteIndex',
                type: 'boolean',
                optional: true
            },
            {
                label: 'Top K',
                name: 'K',
                type: 'number',
                description: 'number of top searches to return as context, default is 4',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Semantic Ratio',
                name: 'semanticRatio',
                type: 'number',
                description: 'percentage of semantic reasoning in meilisearch hybrid search, default is 0.75',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Search Filter',
                name: 'searchFilter',
                type: 'string',
                description: 'search filter to apply on searchable attributes',
                additionalParams: true,
                optional: true,
                acceptVariable: true
            }
        ];
        this.outputs = [
            {
                label: 'Meilisearch Retriever',
                name: 'MeilisearchRetriever',
                description: 'retrieve answers',
                baseClasses: this.baseClasses
            }
        ];
        this.outputs = [
            {
                label: 'Meilisearch Retriever',
                name: 'retriever',
                baseClasses: this.baseClasses
            }
        ];
    }
    async init(nodeData, _, options) {
        const credentialData = await (0, src_1.getCredentialData)(nodeData.credential ?? '', options);
        const meilisearchSearchApiKey = (0, src_1.getCredentialParam)('meilisearchSearchApiKey', credentialData, nodeData);
        const meilisearchAdminApiKey = (0, src_1.getCredentialParam)('meilisearchAdminApiKey', credentialData, nodeData);
        const host = nodeData.inputs?.host;
        const indexUid = nodeData.inputs?.indexUid;
        const K = nodeData.inputs?.K;
        const semanticRatio = nodeData.inputs?.semanticRatio;
        const embeddings = nodeData.inputs?.embeddings;
        const searchFilter = nodeData.inputs?.searchFilter;
        const experimentalEndpoint = host + '/experimental-features/';
        const token = meilisearchAdminApiKey;
        const experimentalOptions = {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                vectorStore: true
            })
        };
        try {
            const response = await fetch(experimentalEndpoint, experimentalOptions);
            if (!response.ok) {
                throw new Error(`Failed to enable vectorStore: ${response.statusText}`);
            }
            const data = await response.json();
            const vectorStoreEnabled = data.vectorStore;
            if (vectorStoreEnabled !== true) {
                throw new Error('Failed to enable vectorStore, vectorStrore property returned is not true');
            }
        }
        catch (error) {
            console.error('Error enabling vectorStore feature:', error);
        }
        const hybridsearchretriever = new core_1.MeilisearchRetriever(host, meilisearchSearchApiKey, indexUid, K, semanticRatio, embeddings, searchFilter);
        return hybridsearchretriever;
    }
}
module.exports = { nodeClass: MeilisearchRetriever_node };
//# sourceMappingURL=Meilisearch.js.map