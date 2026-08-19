"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../src/utils");
const google_genai_1 = require("@langchain/google-genai");
const generative_ai_1 = require("@google/generative-ai");
const modelLoader_1 = require("../../../src/modelLoader");
class GoogleGenerativeAIEmbeddingsWithStripNewLines extends google_genai_1.GoogleGenerativeAIEmbeddings {
    constructor(params) {
        super(params);
        this.stripNewLines = params.stripNewLines ?? false;
    }
    async embedDocuments(texts) {
        const processedTexts = this.stripNewLines ? texts.map((text) => text.replace(/\n/g, ' ')) : texts;
        return super.embedDocuments(processedTexts);
    }
    async embedQuery(text) {
        const processedText = this.stripNewLines ? text.replace(/\n/g, ' ') : text;
        return super.embedQuery(processedText);
    }
}
class GoogleGenerativeAIEmbedding_Embeddings {
    constructor() {
        //@ts-ignore
        this.loadMethods = {
            async listModels() {
                return await (0, modelLoader_1.getModels)(modelLoader_1.MODEL_TYPE.EMBEDDING, 'googleGenerativeAiEmbeddings');
            }
        };
        this.label = 'Google Gemini Embedding';
        this.name = 'googleGenerativeAiEmbeddings';
        this.version = 2.0;
        this.type = 'GoogleGenerativeAiEmbeddings';
        this.icon = 'GoogleGemini.svg';
        this.category = 'Embeddings';
        this.description = 'Google Generative API to generate embeddings for a given text';
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(GoogleGenerativeAIEmbeddingsWithStripNewLines)];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['googleGenerativeAI'],
            optional: false,
            description: 'Google Generative AI credential.'
        };
        this.inputs = [
            {
                label: 'Model Name',
                name: 'modelName',
                type: 'asyncOptions',
                loadMethod: 'listModels',
                default: 'gemini-embedding-001'
            },
            {
                label: 'Task Type',
                name: 'tasktype',
                type: 'options',
                description: 'Type of task for which the embedding will be used',
                options: [
                    { label: 'TASK_TYPE_UNSPECIFIED', name: 'TASK_TYPE_UNSPECIFIED' },
                    { label: 'RETRIEVAL_QUERY', name: 'RETRIEVAL_QUERY' },
                    { label: 'RETRIEVAL_DOCUMENT', name: 'RETRIEVAL_DOCUMENT' },
                    { label: 'SEMANTIC_SIMILARITY', name: 'SEMANTIC_SIMILARITY' },
                    { label: 'CLASSIFICATION', name: 'CLASSIFICATION' },
                    { label: 'CLUSTERING', name: 'CLUSTERING' }
                ],
                default: 'TASK_TYPE_UNSPECIFIED'
            },
            {
                label: 'Strip New Lines',
                name: 'stripNewLines',
                type: 'boolean',
                optional: true,
                additionalParams: true,
                description: 'Remove new lines from input text before embedding to reduce token count'
            }
        ];
    }
    // eslint-disable-next-line unused-imports/no-unused-vars
    async init(nodeData, _, options) {
        const modelName = nodeData.inputs?.modelName;
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
        const apiKey = (0, utils_1.getCredentialParam)('googleGenerativeAPIKey', credentialData, nodeData);
        const stripNewLines = nodeData.inputs?.stripNewLines;
        let taskType;
        switch (nodeData.inputs?.tasktype) {
            case 'RETRIEVAL_QUERY':
                taskType = generative_ai_1.TaskType.RETRIEVAL_QUERY;
                break;
            case 'RETRIEVAL_DOCUMENT':
                taskType = generative_ai_1.TaskType.RETRIEVAL_DOCUMENT;
                break;
            case 'SEMANTIC_SIMILARITY':
                taskType = generative_ai_1.TaskType.SEMANTIC_SIMILARITY;
                break;
            case 'CLASSIFICATION':
                taskType = generative_ai_1.TaskType.CLASSIFICATION;
                break;
            case 'CLUSTERING':
                taskType = generative_ai_1.TaskType.CLUSTERING;
                break;
            default:
                taskType = generative_ai_1.TaskType.TASK_TYPE_UNSPECIFIED;
                break;
        }
        const obj = {
            apiKey: apiKey,
            modelName: modelName,
            taskType: taskType,
            stripNewLines
        };
        const model = new GoogleGenerativeAIEmbeddingsWithStripNewLines(obj);
        return model;
    }
}
module.exports = { nodeClass: GoogleGenerativeAIEmbedding_Embeddings };
//# sourceMappingURL=GoogleGenerativeAIEmbedding.js.map