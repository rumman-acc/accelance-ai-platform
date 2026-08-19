import { MongoClient, type Document as MongoDBDocument } from 'mongodb';
import { MaxMarginalRelevanceSearchOptions, VectorStore } from '@langchain/core/vectorstores';
import type { EmbeddingsInterface } from '@langchain/core/embeddings';
import { Document } from '@langchain/core/documents';
import { AsyncCallerParams } from '@langchain/core/utils/async_caller';
export interface MongoDBAtlasVectorSearchLibArgs extends AsyncCallerParams {
    readonly connectionDetails: {
        readonly mongoDBConnectUrl: string;
        readonly databaseName: string;
        readonly collectionName: string;
    };
    readonly indexName?: string;
    readonly textKey?: string;
    readonly embeddingKey?: string;
    readonly primaryKey?: string;
}
type MongoDBAtlasFilter = {
    preFilter?: MongoDBDocument;
    postFilterPipeline?: MongoDBDocument[];
    includeEmbeddings?: boolean;
} & MongoDBDocument;
export declare class MongoDBAtlasVectorSearch extends VectorStore {
    FilterType: MongoDBAtlasFilter;
    private readonly connectionDetails;
    private readonly indexName;
    private readonly textKey;
    private readonly embeddingKey;
    private readonly primaryKey;
    private caller;
    _vectorstoreType(): string;
    constructor(embeddings: EmbeddingsInterface, args: MongoDBAtlasVectorSearchLibArgs);
    getClient(): Promise<MongoClient>;
    closeConnection(client: MongoClient): Promise<void>;
    addVectors(vectors: number[][], documents: Document[], options?: {
        ids?: string[];
    }): Promise<any[]>;
    addDocuments(documents: Document[], options?: {
        ids?: string[];
    }): Promise<any[]>;
    similaritySearchVectorWithScore(query: number[], k: number, filter?: MongoDBAtlasFilter): Promise<[Document, number][]>;
    maxMarginalRelevanceSearch(query: string, options: MaxMarginalRelevanceSearchOptions<this['FilterType']>): Promise<Document[]>;
    delete(params: {
        ids: any[];
    }): Promise<void>;
    static fromTexts(texts: string[], metadatas: object[] | object, embeddings: EmbeddingsInterface, dbConfig: MongoDBAtlasVectorSearchLibArgs & {
        ids?: string[];
    }): Promise<MongoDBAtlasVectorSearch>;
    static fromDocuments(docs: Document[], embeddings: EmbeddingsInterface, dbConfig: MongoDBAtlasVectorSearchLibArgs & {
        ids?: string[];
    }): Promise<MongoDBAtlasVectorSearch>;
    fixArrayPrecision(array: number[]): number[];
}
export {};
