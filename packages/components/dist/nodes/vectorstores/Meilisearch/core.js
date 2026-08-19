"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeilisearchRetriever = void 0;
const retrievers_1 = require("@langchain/core/retrievers");
const documents_1 = require("@langchain/core/documents");
const meilisearch_1 = require("meilisearch");
class MeilisearchRetriever extends retrievers_1.BaseRetriever {
    constructor(host, meilisearchSearchApiKey, indexUid, K, semanticRatio, embeddings, searchFilter, fields) {
        super(fields);
        this.lc_namespace = ['langchain', 'retrievers'];
        this.meilisearchSearchApiKey = meilisearchSearchApiKey;
        this.host = host;
        this.indexUid = indexUid;
        this.embeddings = embeddings;
        this.searchFilter = searchFilter;
        if (semanticRatio == '') {
            this.semanticRatio = '0.75';
        }
        else {
            let semanticRatio_Float = parseFloat(semanticRatio);
            if (semanticRatio_Float > 1.0) {
                this.semanticRatio = '1.0';
            }
            else if (semanticRatio_Float < 0.0) {
                this.semanticRatio = '0.0';
            }
            else {
                this.semanticRatio = semanticRatio;
            }
        }
        if (K == '') {
            K = '4';
        }
        this.K = K;
    }
    async _getRelevantDocuments(query) {
        // Pass `runManager?.getChild()` when invoking internal runnables to enable tracing
        // const additionalDocs = await someOtherRunnable.invoke(params, runManager?.getChild())
        const client = new meilisearch_1.Meilisearch({
            host: this.host,
            apiKey: this.meilisearchSearchApiKey
        });
        const index = await client.index(this.indexUid);
        const questionEmbedding = await this.embeddings.embedQuery(query);
        // Perform the search
        const searchResults = await index.search(query, {
            filter: this.searchFilter,
            vector: questionEmbedding,
            limit: parseInt(this.K), // Optional: Limit the number of results
            attributesToRetrieve: ['*'], // Optional: Specify which fields to retrieve
            hybrid: {
                semanticRatio: parseFloat(this.semanticRatio),
                embedder: 'ollama'
            }
        });
        const hits = searchResults.hits;
        let documents = [
            new documents_1.Document({
                pageContent: 'mock page',
                metadata: {}
            })
        ];
        try {
            documents = hits.map((hit) => new documents_1.Document({
                pageContent: hit.pageContent,
                metadata: {
                    objectID: hit.objectID,
                    ...hit.metadata
                }
            }));
        }
        catch (e) {
            console.error('Error occurred while adding documents:', e);
        }
        return documents;
    }
}
exports.MeilisearchRetriever = MeilisearchRetriever;
//# sourceMappingURL=core.js.map