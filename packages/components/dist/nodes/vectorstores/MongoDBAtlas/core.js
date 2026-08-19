"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoDBAtlasVectorSearch = void 0;
const mongodb_1 = require("mongodb");
const vectorstores_1 = require("@langchain/core/vectorstores");
const chunk_array_1 = require("@langchain/core/utils/chunk_array");
const documents_1 = require("@langchain/core/documents");
const math_1 = require("@langchain/core/utils/math");
const async_caller_1 = require("@langchain/core/utils/async_caller");
const utils_1 = require("../../../src/utils");
class MongoDBAtlasVectorSearch extends vectorstores_1.VectorStore {
    _vectorstoreType() {
        return 'mongodb_atlas';
    }
    constructor(embeddings, args) {
        super(embeddings, args);
        this.connectionDetails = args.connectionDetails;
        this.indexName = args.indexName ?? 'default';
        this.textKey = args.textKey ?? 'text';
        this.embeddingKey = args.embeddingKey ?? 'embedding';
        this.primaryKey = args.primaryKey ?? '_id';
        this.caller = new async_caller_1.AsyncCaller(args);
    }
    async getClient() {
        const driverInfo = { name: 'Flowise', version: (await (0, utils_1.getVersion)()).version };
        const mongoClient = new mongodb_1.MongoClient(this.connectionDetails.mongoDBConnectUrl, { driverInfo });
        return mongoClient;
    }
    async closeConnection(client) {
        await client.close();
    }
    async addVectors(vectors, documents, options) {
        const client = await this.getClient();
        const collection = client.db(this.connectionDetails.databaseName).collection(this.connectionDetails.collectionName);
        const docs = vectors.map((embedding, idx) => ({
            [this.textKey]: documents[idx].pageContent,
            [this.embeddingKey]: embedding,
            ...documents[idx].metadata
        }));
        if (options?.ids === undefined) {
            await collection.insertMany(docs);
        }
        else {
            if (options.ids.length !== vectors.length) {
                throw new Error(`If provided, "options.ids" must be an array with the same length as "vectors".`);
            }
            const { ids } = options;
            for (let i = 0; i < docs.length; i += 1) {
                await this.caller.call(async () => {
                    await collection.updateOne({ [this.primaryKey]: ids[i] }, { $set: { [this.primaryKey]: ids[i], ...docs[i] } }, { upsert: true });
                });
            }
        }
        await this.closeConnection(client);
        return options?.ids ?? docs.map((doc) => doc[this.primaryKey]);
    }
    async addDocuments(documents, options) {
        const texts = documents.map(({ pageContent }) => pageContent);
        return this.addVectors(await this.embeddings.embedDocuments(texts), documents, options);
    }
    async similaritySearchVectorWithScore(query, k, filter) {
        const client = await this.getClient();
        const collection = client.db(this.connectionDetails.databaseName).collection(this.connectionDetails.collectionName);
        const postFilterPipeline = filter?.postFilterPipeline ?? [];
        const preFilter = filter?.preFilter || filter?.postFilterPipeline || filter?.includeEmbeddings ? filter.preFilter : filter;
        const removeEmbeddingsPipeline = !filter?.includeEmbeddings
            ? [
                {
                    $project: {
                        [this.embeddingKey]: 0
                    }
                }
            ]
            : [];
        const pipeline = [
            {
                $vectorSearch: {
                    queryVector: this.fixArrayPrecision(query),
                    index: this.indexName,
                    path: this.embeddingKey,
                    limit: k,
                    numCandidates: 10 * k,
                    ...(preFilter && { filter: preFilter })
                }
            },
            {
                $set: {
                    score: { $meta: 'vectorSearchScore' }
                }
            },
            ...removeEmbeddingsPipeline,
            ...postFilterPipeline
        ];
        const results = await collection
            .aggregate(pipeline)
            .map((result) => {
            const { score, [this.textKey]: text, ...metadata } = result;
            return [new documents_1.Document({ pageContent: text, metadata }), score];
        })
            .toArray();
        await this.closeConnection(client);
        return results;
    }
    async maxMarginalRelevanceSearch(query, options) {
        const { k, fetchK = 20, lambda = 0.5, filter } = options;
        const queryEmbedding = await this.embeddings.embedQuery(query);
        // preserve the original value of includeEmbeddings
        const includeEmbeddingsFlag = options.filter?.includeEmbeddings || false;
        // update filter to include embeddings, as they will be used in MMR
        const includeEmbeddingsFilter = {
            ...filter,
            includeEmbeddings: true
        };
        const resultDocs = await this.similaritySearchVectorWithScore(this.fixArrayPrecision(queryEmbedding), fetchK, includeEmbeddingsFilter);
        const embeddingList = resultDocs.map((doc) => doc[0].metadata[this.embeddingKey]);
        const mmrIndexes = (0, math_1.maximalMarginalRelevance)(queryEmbedding, embeddingList, lambda, k);
        return mmrIndexes.map((idx) => {
            const doc = resultDocs[idx][0];
            // remove embeddings if they were not requested originally
            if (!includeEmbeddingsFlag) {
                delete doc.metadata[this.embeddingKey];
            }
            return doc;
        });
    }
    async delete(params) {
        const client = await this.getClient();
        const collection = client.db(this.connectionDetails.databaseName).collection(this.connectionDetails.collectionName);
        const CHUNK_SIZE = 50;
        const chunkIds = (0, chunk_array_1.chunkArray)(params.ids, CHUNK_SIZE);
        for (const chunk of chunkIds) {
            await collection.deleteMany({ _id: { $in: chunk } });
        }
        await this.closeConnection(client);
    }
    static async fromTexts(texts, metadatas, embeddings, dbConfig) {
        const docs = [];
        for (let i = 0; i < texts.length; i += 1) {
            const metadata = Array.isArray(metadatas) ? metadatas[i] : metadatas;
            const newDoc = new documents_1.Document({
                pageContent: texts[i],
                metadata
            });
            docs.push(newDoc);
        }
        return MongoDBAtlasVectorSearch.fromDocuments(docs, embeddings, dbConfig);
    }
    static async fromDocuments(docs, embeddings, dbConfig) {
        const instance = new this(embeddings, dbConfig);
        await instance.addDocuments(docs, { ids: dbConfig.ids });
        return instance;
    }
    fixArrayPrecision(array) {
        return array.map((value) => {
            if (Number.isInteger(value)) {
                return value + 0.000000000000001;
            }
            return value;
        });
    }
}
exports.MongoDBAtlasVectorSearch = MongoDBAtlasVectorSearch;
//# sourceMappingURL=core.js.map