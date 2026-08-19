"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const documents_1 = require("@langchain/core/documents");
const utils_1 = require("../../../src/utils");
const indexing_1 = require("../../../src/indexing");
const VectorStoreUtils_1 = require("../VectorStoreUtils");
const vectorstores_1 = require("@langchain/core/vectorstores");
const TypeORM_1 = require("./driver/TypeORM");
// import { PGVectorDriver } from './driver/PGVector'
const utils_2 = require("./utils");
const serverCredentialsExists = !!process.env.POSTGRES_VECTORSTORE_USER && !!process.env.POSTGRES_VECTORSTORE_PASSWORD;
// added temporarily to fix the base class return for VectorStore when postgres node is using TypeORM
function getVectorStoreBaseClasses() {
    // Try getting base classes through the utility function
    const baseClasses = (0, utils_1.getBaseClasses)(vectorstores_1.VectorStore);
    // If we got results, return them
    if (baseClasses && baseClasses.length > 0) {
        return baseClasses;
    }
    // If VectorStore is recognized as a class but getBaseClasses returned nothing,
    // return the known inheritance chain
    if (vectorstores_1.VectorStore instanceof Function) {
        return ['VectorStore'];
    }
    // Fallback to minimum required class
    return ['VectorStore'];
}
class Postgres_VectorStores {
    constructor() {
        //@ts-ignore
        this.vectorStoreMethods = {
            async upsert(nodeData, options) {
                const tableName = (0, utils_2.getTableName)(nodeData);
                const docs = nodeData.inputs?.document;
                const recordManager = nodeData.inputs?.recordManager;
                const isFileUploadEnabled = nodeData.inputs?.fileUpload;
                const _batchSize = nodeData.inputs?.batchSize;
                const vectorStoreDriver = Postgres_VectorStores.getDriverFromConfig(nodeData, options);
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
                try {
                    if (recordManager) {
                        const vectorStore = await vectorStoreDriver.instanciate();
                        await recordManager.createSchema();
                        const res = await (0, indexing_1.index)({
                            docsSource: finalDocs,
                            recordManager,
                            vectorStore,
                            options: {
                                cleanup: recordManager?.cleanup,
                                sourceIdKey: recordManager?.sourceIdKey ?? 'source',
                                vectorStoreName: tableName
                            }
                        });
                        return res;
                    }
                    else {
                        if (_batchSize) {
                            const batchSize = parseInt(_batchSize, 10);
                            for (let i = 0; i < finalDocs.length; i += batchSize) {
                                const batch = finalDocs.slice(i, i + batchSize);
                                await vectorStoreDriver.fromDocuments(batch);
                            }
                        }
                        else {
                            await vectorStoreDriver.fromDocuments(finalDocs);
                        }
                        return { numAdded: finalDocs.length, addedDocs: finalDocs };
                    }
                }
                catch (e) {
                    throw new Error(e);
                }
            },
            async delete(nodeData, ids, options) {
                const vectorStoreDriver = Postgres_VectorStores.getDriverFromConfig(nodeData, options);
                const tableName = (0, utils_2.getTableName)(nodeData);
                const recordManager = nodeData.inputs?.recordManager;
                const vectorStore = await vectorStoreDriver.instanciate();
                try {
                    if (recordManager) {
                        const vectorStoreName = tableName;
                        await recordManager.createSchema();
                        recordManager.namespace = recordManager.namespace + '_' + vectorStoreName;
                        const filterKeys = {};
                        if (options.docId) {
                            filterKeys.docId = options.docId;
                        }
                        const keys = await recordManager.listKeys(filterKeys);
                        await vectorStore.delete({ ids: keys });
                        await recordManager.deleteKeys(keys);
                    }
                    else {
                        await vectorStore.delete({ ids });
                    }
                }
                catch (e) {
                    throw new Error(e);
                }
            }
        };
        this.label = 'Postgres';
        this.name = 'postgres';
        this.version = 7.1;
        this.type = 'Postgres';
        this.icon = 'postgres.svg';
        this.category = 'Vector Stores';
        this.description = 'Upsert embedded data and perform similarity search upon query using pgvector on Postgres';
        this.baseClasses = [this.type, 'VectorStoreRetriever', 'BaseRetriever'];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['PostgresApi'],
            optional: serverCredentialsExists
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
                label: 'Host',
                name: 'host',
                type: 'string',
                placeholder: (0, utils_2.getHost)(),
                optional: !!(0, utils_2.getHost)()
            },
            {
                label: 'Database',
                name: 'database',
                type: 'string',
                placeholder: (0, utils_2.getDatabase)(),
                optional: !!(0, utils_2.getDatabase)()
            },
            {
                label: 'Port',
                name: 'port',
                type: 'number',
                placeholder: (0, utils_2.getPort)(),
                optional: true
            },
            {
                label: 'SSL',
                name: 'ssl',
                description: 'Use SSL to connect to Postgres',
                type: 'boolean',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Table Name',
                name: 'tableName',
                type: 'string',
                placeholder: (0, utils_2.getTableName)(),
                additionalParams: true,
                optional: true
            },
            /*{
                label: 'Driver',
                name: 'driver',
                type: 'options',
                default: 'typeorm',
                description: 'Different option to connect to Postgres',
                options: [
                    {
                        label: 'TypeORM',
                        name: 'typeorm'
                    },
                    {
                        label: 'PGVector',
                        name: 'pgvector'
                    }
                ],
                optional: true,
                additionalParams: true
            },*/
            {
                label: 'Distance Strategy',
                name: 'distanceStrategy',
                description: 'Strategy for calculating distances between vectors',
                type: 'options',
                options: [
                    {
                        label: 'Cosine',
                        name: 'cosine'
                    },
                    {
                        label: 'Euclidean',
                        name: 'euclidean'
                    },
                    {
                        label: 'Inner Product',
                        name: 'innerProduct'
                    }
                ],
                additionalParams: true,
                default: 'cosine',
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
                label: 'Upsert Batch Size',
                name: 'batchSize',
                type: 'number',
                step: 1,
                description: 'Upsert in batches of size N',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Additional Configuration',
                name: 'additionalConfig',
                type: 'json',
                description: 'Optional TypeORM connection options (e.g. ssl, connectTimeout). entities, subscribers, migrations, and extra are not allowed.',
                additionalParams: true,
                optional: true
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
                label: 'Postgres Metadata Filter',
                name: 'pgMetadataFilter',
                type: 'json',
                additionalParams: true,
                optional: true,
                acceptVariable: true
            },
            {
                label: 'Content Column Name',
                name: 'contentColumnName',
                description: 'Column name to store the text content (PGVector Driver only, others use pageContent)',
                type: 'string',
                placeholder: (0, utils_2.getContentColumnName)(),
                additionalParams: true,
                optional: true
            }
        ];
        this.outputs = [
            {
                label: 'Postgres Retriever',
                name: 'retriever',
                baseClasses: this.baseClasses
            },
            {
                label: 'Postgres Vector Store',
                name: 'vectorStore',
                baseClasses: [
                    this.type,
                    // ...getBaseClasses(VectorStore), // disabled temporarily for using TypeORM
                    ...getVectorStoreBaseClasses() // added temporarily for using TypeORM
                ]
            }
        ];
    }
    async init(nodeData, _, options) {
        const vectorStoreDriver = Postgres_VectorStores.getDriverFromConfig(nodeData, options);
        const output = nodeData.outputs?.output;
        const topK = nodeData.inputs?.topK;
        const k = topK ? parseFloat(topK) : 4;
        const _pgMetadataFilter = nodeData.inputs?.pgMetadataFilter;
        const isFileUploadEnabled = nodeData.inputs?.fileUpload;
        let pgMetadataFilter;
        if (_pgMetadataFilter) {
            pgMetadataFilter = typeof _pgMetadataFilter === 'object' ? _pgMetadataFilter : (0, utils_1.parseJsonBody)(_pgMetadataFilter);
        }
        if (isFileUploadEnabled && options.chatId) {
            pgMetadataFilter = {
                ...(pgMetadataFilter || {}),
                [utils_1.FLOWISE_CHATID]: options.chatId
            };
        }
        const vectorStore = await vectorStoreDriver.instanciate(pgMetadataFilter);
        if (output === 'retriever') {
            const retriever = vectorStore.asRetriever(k);
            return retriever;
        }
        else if (output === 'vectorStore') {
            ;
            vectorStore.k = k;
            if (pgMetadataFilter) {
                ;
                vectorStore.filter = pgMetadataFilter;
            }
            return vectorStore;
        }
        return vectorStore;
    }
    static getDriverFromConfig(nodeData, options) {
        /*switch (nodeData.inputs?.driver) {
            case 'typeorm':
                return new TypeORMDriver(nodeData, options)
            case 'pgvector':
                return new PGVectorDriver(nodeData, options)
            default:
                return new TypeORMDriver(nodeData, options)
        }*/
        return new TypeORM_1.TypeORMDriver(nodeData, options);
    }
}
module.exports = { nodeClass: Postgres_VectorStores };
//# sourceMappingURL=Postgres.js.map