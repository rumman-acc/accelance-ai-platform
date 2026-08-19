"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const documents_1 = require("@langchain/core/documents");
const vectorstores_1 = require("@langchain/core/vectorstores");
const src_1 = require("../../../src");
const v3_1 = require("zod/v3");
const commonUtils_1 = require("../../sequentialagents/commonUtils");
const queryPrefix = 'query';
const defaultPrompt = `Extract keywords from the query: {{${queryPrefix}}}`;
class ExtractMetadataRetriever_Retrievers {
    constructor() {
        this.label = 'Extract Metadata Retriever';
        this.name = 'extractMetadataRetriever';
        this.version = 1.0;
        this.type = 'ExtractMetadataRetriever';
        this.icon = 'dynamicMetadataRetriever.svg';
        this.category = 'Retrievers';
        this.description = 'Extract keywords/metadata from the query and use it to filter documents';
        this.baseClasses = [this.type, 'BaseRetriever'];
        this.inputs = [
            {
                label: 'Vector Store',
                name: 'vectorStore',
                type: 'VectorStore'
            },
            {
                label: 'Chat Model',
                name: 'model',
                type: 'BaseChatModel'
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
                label: 'Prompt',
                name: 'dynamicMetadataFilterRetrieverPrompt',
                type: 'string',
                description: 'Prompt to extract metadata from query',
                rows: 4,
                additionalParams: true,
                default: defaultPrompt
            },
            {
                label: 'JSON Structured Output',
                name: 'dynamicMetadataFilterRetrieverStructuredOutput',
                type: 'datagrid',
                description: 'Instruct the model to give output in a JSON structured schema. This output will be used as the metadata filter for connected vector store',
                datagrid: [
                    { field: 'key', headerName: 'Key', editable: true },
                    {
                        field: 'type',
                        headerName: 'Type',
                        type: 'singleSelect',
                        valueOptions: ['String', 'String Array', 'Number', 'Boolean', 'Enum'],
                        editable: true
                    },
                    { field: 'enumValues', headerName: 'Enum Values', editable: true },
                    { field: 'description', headerName: 'Description', flex: 1, editable: true }
                ],
                optional: true,
                additionalParams: true
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
                label: 'Extract Metadata Retriever',
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
        let llm = nodeData.inputs?.model;
        const llmStructuredOutput = nodeData.inputs?.dynamicMetadataFilterRetrieverStructuredOutput;
        const topK = nodeData.inputs?.topK;
        const dynamicMetadataFilterRetrieverPrompt = nodeData.inputs?.dynamicMetadataFilterRetrieverPrompt;
        const query = nodeData.inputs?.query;
        const finalInputQuery = query ? query : input;
        const output = nodeData.outputs?.output;
        if (llmStructuredOutput && llmStructuredOutput !== '[]') {
            try {
                const structuredOutput = v3_1.z.object((0, commonUtils_1.convertStructuredSchemaToZod)(llmStructuredOutput));
                // @ts-ignore
                llm = llm.withStructuredOutput(structuredOutput, {
                    method: 'functionCalling'
                });
            }
            catch (exception) {
                console.error(exception);
            }
        }
        const retriever = DynamicMetadataRetriever.fromVectorStore(vectorStore, {
            structuredLLM: llm,
            prompt: dynamicMetadataFilterRetrieverPrompt,
            topK: topK ? parseInt(topK, 10) : vectorStore?.k ?? 4
        });
        retriever.filter = vectorStore?.lc_kwargs?.filter ?? vectorStore.filter;
        if (output === 'retriever')
            return retriever;
        else if (output === 'document')
            return await retriever.getRelevantDocuments(finalInputQuery);
        else if (output === 'text') {
            let finaltext = '';
            const docs = await retriever.getRelevantDocuments(finalInputQuery);
            for (const doc of docs)
                finaltext += `${doc.pageContent}\n`;
            return (0, src_1.handleEscapeCharacters)(finaltext, false);
        }
        return retriever;
    }
}
class DynamicMetadataRetriever extends vectorstores_1.VectorStoreRetriever {
    constructor(input) {
        super(input);
        this.topK = 4;
        this.prompt = '';
        this.topK = input.topK ?? this.topK;
        this.structuredLLM = input.structuredLLM ?? this.structuredLLM;
        this.prompt = input.prompt ?? this.prompt;
    }
    async getFilter(query) {
        const structuredResponse = await this.structuredLLM.invoke(this.prompt.replace(`{{${queryPrefix}}}`, query));
        return structuredResponse;
    }
    async getRelevantDocuments(query) {
        const newFilter = await this.getFilter(query);
        // @ts-ignore
        this.filter = { ...this.filter, ...newFilter };
        const results = await this.vectorStore.similaritySearchWithScore(query, this.topK, this.filter);
        const finalDocs = [];
        for (const result of results) {
            finalDocs.push(new documents_1.Document({
                pageContent: result[0].pageContent,
                metadata: result[0].metadata
            }));
        }
        return finalDocs;
    }
    static fromVectorStore(vectorStore, options) {
        return new this({ ...options, vectorStore });
    }
}
module.exports = { nodeClass: ExtractMetadataRetriever_Retrievers };
//# sourceMappingURL=ExtractMetadataRetriever.js.map