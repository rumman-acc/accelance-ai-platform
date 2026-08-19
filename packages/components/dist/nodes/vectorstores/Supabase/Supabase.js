"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const uuid_1 = require("uuid");
const supabase_js_1 = require("@supabase/supabase-js");
const documents_1 = require("@langchain/core/documents");
const supabase_1 = require("@langchain/community/vectorstores/supabase");
const utils_1 = require("../../../src/utils");
const VectorStoreUtils_1 = require("../VectorStoreUtils");
const indexing_1 = require("../../../src/indexing");
const filterParser_1 = require("./filterParser");
class Supabase_VectorStores {
    constructor() {
        //@ts-ignore
        this.vectorStoreMethods = {
            async upsert(nodeData, options) {
                const supabaseProjUrl = nodeData.inputs?.supabaseProjUrl;
                const tableName = nodeData.inputs?.tableName;
                const queryName = nodeData.inputs?.queryName;
                const docs = nodeData.inputs?.document;
                const embeddings = nodeData.inputs?.embeddings;
                const recordManager = nodeData.inputs?.recordManager;
                const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
                const supabaseApiKey = (0, utils_1.getCredentialParam)('supabaseApiKey', credentialData, nodeData);
                const client = (0, supabase_js_1.createClient)(supabaseProjUrl, supabaseApiKey);
                const flattenDocs = docs && docs.length ? (0, lodash_1.flatten)(docs) : [];
                const finalDocs = [];
                for (let i = 0; i < flattenDocs.length; i += 1) {
                    if (flattenDocs[i] && flattenDocs[i].pageContent) {
                        finalDocs.push(new documents_1.Document(flattenDocs[i]));
                    }
                }
                try {
                    if (recordManager) {
                        const vectorStore = await SupabaseUpsertVectorStore.fromExistingIndex(embeddings, {
                            client,
                            tableName: tableName,
                            queryName: queryName
                        });
                        await recordManager.createSchema();
                        const res = await (0, indexing_1.index)({
                            docsSource: finalDocs,
                            recordManager,
                            vectorStore,
                            options: {
                                cleanup: recordManager?.cleanup,
                                sourceIdKey: recordManager?.sourceIdKey ?? 'source',
                                vectorStoreName: tableName + '_' + queryName
                            }
                        });
                        return res;
                    }
                    else {
                        await SupabaseUpsertVectorStore.fromDocuments(finalDocs, embeddings, {
                            client,
                            tableName: tableName,
                            queryName: queryName
                        });
                        return { numAdded: finalDocs.length, addedDocs: finalDocs };
                    }
                }
                catch (e) {
                    throw new Error(e);
                }
            },
            async delete(nodeData, ids, options) {
                const supabaseProjUrl = nodeData.inputs?.supabaseProjUrl;
                const tableName = nodeData.inputs?.tableName;
                const queryName = nodeData.inputs?.queryName;
                const embeddings = nodeData.inputs?.embeddings;
                const recordManager = nodeData.inputs?.recordManager;
                const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
                const supabaseApiKey = (0, utils_1.getCredentialParam)('supabaseApiKey', credentialData, nodeData);
                const client = (0, supabase_js_1.createClient)(supabaseProjUrl, supabaseApiKey);
                const supabaseStore = new supabase_1.SupabaseVectorStore(embeddings, {
                    client,
                    tableName: tableName,
                    queryName: queryName
                });
                try {
                    if (recordManager) {
                        const vectorStoreName = tableName + '_' + queryName;
                        await recordManager.createSchema();
                        recordManager.namespace = recordManager.namespace + '_' + vectorStoreName;
                        const filterKeys = {};
                        if (options.docId) {
                            filterKeys.docId = options.docId;
                        }
                        const keys = await recordManager.listKeys(filterKeys);
                        await supabaseStore.delete({ ids: keys });
                        await recordManager.deleteKeys(keys);
                    }
                    else {
                        await supabaseStore.delete({ ids });
                    }
                }
                catch (e) {
                    throw new Error(e);
                }
            }
        };
        this.label = 'Supabase';
        this.name = 'supabase';
        this.version = 4.0;
        this.type = 'Supabase';
        this.icon = 'supabase.svg';
        this.category = 'Vector Stores';
        this.description = 'Upsert embedded data and perform similarity or mmr search upon query using Supabase via pgvector extension';
        this.baseClasses = [this.type, 'VectorStoreRetriever', 'BaseRetriever'];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['supabaseApi']
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
                label: 'Supabase Project URL',
                name: 'supabaseProjUrl',
                type: 'string'
            },
            {
                label: 'Table Name',
                name: 'tableName',
                type: 'string'
            },
            {
                label: 'Query Name',
                name: 'queryName',
                type: 'string'
            },
            {
                label: 'Supabase Metadata Filter',
                name: 'supabaseMetadataFilter',
                type: 'json',
                optional: true,
                additionalParams: true,
                acceptVariable: true
            },
            {
                label: 'Supabase RPC Filter',
                name: 'supabaseRPCFilter',
                type: 'string',
                rows: 4,
                placeholder: `filter("metadata->a::int", "gt", 5)
.filter("metadata->c::int", "gt", 7)
.filter("metadata->>stuff", "eq", "right");`,
                description: 'Query builder-style filtering. If this is set, will override the metadata filter. Refer <a href="https://js.langchain.com/v0.1/docs/integrations/vectorstores/supabase/#metadata-query-builder-filtering" target="_blank">here</a> for more information',
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
            }
        ];
        (0, VectorStoreUtils_1.addMMRInputParams)(this.inputs);
        this.outputs = [
            {
                label: 'Supabase Retriever',
                name: 'retriever',
                baseClasses: this.baseClasses
            },
            {
                label: 'Supabase Vector Store',
                name: 'vectorStore',
                baseClasses: [this.type, ...(0, utils_1.getBaseClasses)(supabase_1.SupabaseVectorStore)]
            }
        ];
    }
    async init(nodeData, _, options) {
        const supabaseProjUrl = nodeData.inputs?.supabaseProjUrl;
        const tableName = nodeData.inputs?.tableName;
        const queryName = nodeData.inputs?.queryName;
        const embeddings = nodeData.inputs?.embeddings;
        const supabaseMetadataFilter = nodeData.inputs?.supabaseMetadataFilter;
        const supabaseRPCFilter = nodeData.inputs?.supabaseRPCFilter;
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
        const supabaseApiKey = (0, utils_1.getCredentialParam)('supabaseApiKey', credentialData, nodeData);
        const client = (0, supabase_js_1.createClient)(supabaseProjUrl, supabaseApiKey);
        const obj = {
            client,
            tableName,
            queryName
        };
        if (supabaseMetadataFilter) {
            const metadatafilter = typeof supabaseMetadataFilter === 'object' ? supabaseMetadataFilter : (0, utils_1.parseJsonBody)(supabaseMetadataFilter);
            obj.filter = metadatafilter;
        }
        if (supabaseRPCFilter) {
            obj.filter = filterParser_1.FilterParser.parseFilterString(supabaseRPCFilter);
        }
        const vectorStore = await supabase_1.SupabaseVectorStore.fromExistingIndex(embeddings, obj);
        return (0, VectorStoreUtils_1.resolveVectorStoreOrRetriever)(nodeData, vectorStore, obj.filter);
    }
}
class SupabaseUpsertVectorStore extends supabase_1.SupabaseVectorStore {
    async addVectors(vectors, documents, options) {
        if (vectors.length === 0) {
            return [];
        }
        const rows = vectors.map((embedding, idx) => ({
            content: documents[idx].pageContent,
            embedding,
            metadata: documents[idx].metadata
        }));
        let returnedIds = [];
        for (let i = 0; i < rows.length; i += this.upsertBatchSize) {
            const chunk = rows.slice(i, i + this.upsertBatchSize).map((row, j) => {
                if (options?.ids) {
                    return { id: options.ids[i + j], ...row };
                }
                return row;
            });
            let res = await this.client.from(this.tableName).upsert(chunk).select();
            if (res.error) {
                // If the error is due to null value in column "id", we will generate a new id for the row
                if (res.error.message.includes(`null value in column "id"`)) {
                    const chunk = rows.slice(i, i + this.upsertBatchSize).map((row, y) => {
                        if (options?.ids) {
                            return { id: options.ids[i + y], ...row };
                        }
                        return { id: (0, uuid_1.v4)(), ...row };
                    });
                    res = await this.client.from(this.tableName).upsert(chunk).select();
                    if (res.error) {
                        throw new Error(`Error inserting: ${res.error.message} ${res.status} ${res.statusText}`);
                    }
                }
                else {
                    throw new Error(`Error inserting: ${res.error.message} ${res.status} ${res.statusText}`);
                }
            }
            if (res.data) {
                returnedIds = returnedIds.concat(res.data.map((row) => row.id));
            }
        }
        return returnedIds;
    }
}
module.exports = { nodeClass: Supabase_VectorStores };
//# sourceMappingURL=Supabase.js.map