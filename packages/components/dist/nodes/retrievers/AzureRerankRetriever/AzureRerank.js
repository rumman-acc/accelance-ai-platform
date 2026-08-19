'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.AzureRerank = void 0
const httpSecurity_1 = require('../../../src/httpSecurity')
const document_compressors_1 = require('@langchain/classic/retrievers/document_compressors')
class AzureRerank extends document_compressors_1.BaseDocumentCompressor {
    constructor(azureApiKey, azureApiUrl, model, k, maxChunksPerDoc) {
        super()
        this.azureApiKey = azureApiKey
        this.azureApiUrl = azureApiUrl
        this.model = model
        this.k = k
        this.maxChunksPerDoc = maxChunksPerDoc
    }
    async compressDocuments(documents, query, _) {
        // avoid empty api call
        if (documents.length === 0) {
            return []
        }
        const config = {
            headers: {
                'api-key': `${this.azureApiKey}`,
                'Content-Type': 'application/json',
                Accept: 'application/json'
            }
        }
        const data = {
            model: this.model,
            top_n: this.k,
            max_chunks_per_doc: this.maxChunksPerDoc,
            query: query,
            return_documents: false,
            documents: documents.map((doc) => doc.pageContent)
        }
        try {
            let returnedDocs = await (0, httpSecurity_1.secureAxiosRequest)({ method: 'POST', url: this.azureApiUrl, data, ...config })
            const finalResults = []
            returnedDocs.data.results.forEach((result) => {
                const doc = documents[result.index]
                doc.metadata.relevance_score = result.relevance_score
                finalResults.push(doc)
            })
            return finalResults.splice(0, this.k)
        } catch (error) {
            throw new Error(`Azure Rerank API call failed: ${error.message}`)
        }
    }
}
exports.AzureRerank = AzureRerank
//# sourceMappingURL=AzureRerank.js.map
