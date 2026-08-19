"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const documents_1 = require("@langchain/core/documents");
const vectorstores_1 = require("@langchain/core/vectorstores");
const src_1 = require("../../../src");
const defaultReturnFormat = '{{context}}\nSource: {{metadata.source}}';
class CustomRetriever_Retrievers {
    constructor() {
        this.label = 'Custom Retriever';
        this.name = 'customRetriever';
        this.version = 1.0;
        this.type = 'CustomRetriever';
        this.icon = 'customRetriever.svg';
        this.category = 'Retrievers';
        this.description = 'Return results based on predefined format';
        this.baseClasses = [this.type, 'BaseRetriever'];
        this.inputs = [
            {
                label: 'Vector Store',
                name: 'vectorStore',
                type: 'VectorStore'
            },
            {
                label: 'Query',
                name: 'query',
                type: 'string',
                description: 'Query to retrieve documents from retriever. If not specified, user question will be used',
                optional: true,
                acceptVariable: true
            },
            {
                label: 'Result Format',
                name: 'resultFormat',
                type: 'string',
                rows: 4,
                description: 'Format to return the results in. Use {{context}} to insert the pageContent of the document and {{metadata.key}} to insert metadata values.',
                default: defaultReturnFormat
            },
            {
                label: 'Top K',
                name: 'topK',
                description: 'Number of top results to fetch. Default to vector store topK',
                placeholder: '4',
                type: 'number',
                additionalParams: true,
                optional: true
            }
        ];
        this.outputs = [
            {
                label: 'Custom Retriever',
                name: 'retriever',
                baseClasses: this.baseClasses
            },
            {
                label: 'Document',
                name: 'document',
                description: 'Array of document objects containing metadata and pageContent',
                baseClasses: ['Document', 'json']
            },
            {
                label: 'Text',
                name: 'text',
                description: 'Concatenated string from pageContent of documents',
                baseClasses: ['string', 'json']
            }
        ];
    }
    async init(nodeData, input) {
        const vectorStore = nodeData.inputs?.vectorStore;
        const query = nodeData.inputs?.query;
        const topK = nodeData.inputs?.topK;
        const resultFormat = nodeData.inputs?.resultFormat;
        const output = nodeData.outputs?.output;
        const retriever = CustomRetriever.fromVectorStore(vectorStore, {
            resultFormat,
            topK: topK ? parseInt(topK, 10) : vectorStore?.k ?? 4
        });
        if (output === 'retriever')
            return retriever;
        else if (output === 'document')
            return await retriever.getRelevantDocuments(query ? query : input);
        else if (output === 'text') {
            let finaltext = '';
            const docs = await retriever.getRelevantDocuments(query ? query : input);
            for (const doc of docs)
                finaltext += `${doc.pageContent}\n`;
            return (0, src_1.handleEscapeCharacters)(finaltext, false);
        }
        return retriever;
    }
}
class CustomRetriever extends vectorstores_1.VectorStoreRetriever {
    constructor(input) {
        super(input);
        this.topK = 4;
        this.topK = input.topK ?? this.topK;
        this.resultFormat = input.resultFormat ?? this.resultFormat;
    }
    async getRelevantDocuments(query) {
        const results = await this.vectorStore.similaritySearchWithScore(query, this.topK, this.filter);
        const finalDocs = [];
        for (const result of results) {
            let res = this.resultFormat.replace(/{{context}}/g, result[0].pageContent);
            res = replaceMetadata(res, result[0].metadata);
            finalDocs.push(new documents_1.Document({
                pageContent: res,
                metadata: result[0].metadata
            }));
        }
        return finalDocs;
    }
    static fromVectorStore(vectorStore, options) {
        return new this({ ...options, vectorStore });
    }
}
function replaceMetadata(template, metadata) {
    const metadataRegex = /{{metadata\.([\w.]+)}}/g;
    return template.replace(metadataRegex, (match, path) => {
        const value = (0, lodash_1.get)(metadata, path);
        return value !== undefined ? String(value) : match;
    });
}
module.exports = { nodeClass: CustomRetriever_Retrievers };
//# sourceMappingURL=CustomRetriever.js.map