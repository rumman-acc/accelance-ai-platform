import { BaseRetriever, type BaseRetrieverInput } from '@langchain/core/retrievers';
import { Document } from '@langchain/core/documents';
import { Embeddings } from '@langchain/core/embeddings';
export interface CustomRetrieverInput extends BaseRetrieverInput {
}
export declare class MeilisearchRetriever extends BaseRetriever {
    lc_namespace: string[];
    private readonly meilisearchSearchApiKey;
    private readonly host;
    private indexUid;
    private K;
    private semanticRatio;
    private embeddings;
    private searchFilter;
    constructor(host: string, meilisearchSearchApiKey: any, indexUid: string, K: string, semanticRatio: string, embeddings: Embeddings, searchFilter: string, fields?: CustomRetrieverInput);
    _getRelevantDocuments(query: string): Promise<Document[]>;
}
