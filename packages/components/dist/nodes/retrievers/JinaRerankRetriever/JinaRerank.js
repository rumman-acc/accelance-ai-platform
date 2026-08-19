'use strict'
var __importDefault =
    (this && this.__importDefault) ||
    function (mod) {
        return mod && mod.__esModule ? mod : { default: mod }
    }
Object.defineProperty(exports, '__esModule', { value: true })
exports.JinaRerank = void 0
const axios_1 = __importDefault(require('axios'))
const document_compressors_1 = require('@langchain/classic/retrievers/document_compressors')
class JinaRerank extends document_compressors_1.BaseDocumentCompressor {
    constructor(jinaAPIKey, model, topN) {
        super()
        this.JINA_RERANK_API_URL = 'https://api.jina.ai/v1/rerank'
        this.model = 'jina-reranker-v2-base-multilingual'
        this.jinaAPIKey = jinaAPIKey
        this.model = model
        this.topN = topN
    }
    async compressDocuments(documents, query, _) {
        if (documents.length === 0) {
            return []
        }
        const config = {
            headers: {
                Authorization: `Bearer ${this.jinaAPIKey}`,
                'Content-Type': 'application/json'
            }
        }
        const data = {
            model: this.model,
            query: query,
            documents: documents.map((doc) => doc.pageContent),
            top_n: this.topN
        }
        try {
            let returnedDocs = await axios_1.default.post(this.JINA_RERANK_API_URL, data, config)
            const finalResults = []
            returnedDocs.data.results.forEach((result) => {
                const doc = documents[result.index]
                doc.metadata.relevance_score = result.relevance_score
                finalResults.push(doc)
            })
            return finalResults
        } catch (error) {
            return documents
        }
    }
}
exports.JinaRerank = JinaRerank
//# sourceMappingURL=JinaRerank.js.map
