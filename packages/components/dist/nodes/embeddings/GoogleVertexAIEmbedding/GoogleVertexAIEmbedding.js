"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const google_vertexai_1 = require("@langchain/google-vertexai");
const google_utils_1 = require("../../../src/google-utils");
const modelLoader_1 = require("../../../src/modelLoader");
const utils_1 = require("../../../src/utils");
class VertexAIEmbeddingsWithStripNewLines extends google_vertexai_1.VertexAIEmbeddings {
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
class GoogleVertexAIEmbedding_Embeddings {
    constructor() {
        //@ts-ignore
        this.loadMethods = {
            async listModels() {
                return await (0, modelLoader_1.getModels)(modelLoader_1.MODEL_TYPE.EMBEDDING, 'googlevertexaiEmbeddings');
            },
            async listRegions() {
                return await (0, modelLoader_1.getRegions)(modelLoader_1.MODEL_TYPE.EMBEDDING, 'googlevertexaiEmbeddings');
            }
        };
        this.label = 'Google VertexAI Embedding';
        this.name = 'googlevertexaiEmbeddings';
        this.version = 2.1;
        this.type = 'GoogleVertexAIEmbeddings';
        this.icon = 'GoogleVertex.svg';
        this.category = 'Embeddings';
        this.description = 'Google vertexAI API to generate embeddings for a given text';
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(VertexAIEmbeddingsWithStripNewLines)];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['googleVertexAuth'],
            optional: true,
            description: 'Google Vertex AI credential. If you are using a GCP service like Cloud Run, or if you have installed default credentials on your local machine, you do not need to set this credential.'
        };
        this.inputs = [
            {
                label: 'Model Name',
                name: 'modelName',
                type: 'asyncOptions',
                loadMethod: 'listModels',
                default: 'text-embedding-004'
            },
            {
                label: 'Region',
                description: 'Region to use for the model.',
                name: 'region',
                type: 'asyncOptions',
                loadMethod: 'listRegions',
                optional: true
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
    async init(nodeData, _, options) {
        const modelName = nodeData.inputs?.modelName;
        const region = nodeData.inputs?.region;
        const stripNewLines = nodeData.inputs?.stripNewLines;
        const obj = {
            model: modelName,
            stripNewLines
        };
        const authOptions = await (0, google_utils_1.buildGoogleCredentials)(nodeData, options);
        if (authOptions && Object.keys(authOptions).length !== 0)
            obj.authOptions = authOptions;
        if (region)
            obj.location = region;
        const model = new VertexAIEmbeddingsWithStripNewLines(obj);
        return model;
    }
}
module.exports = { nodeClass: GoogleVertexAIEmbedding_Embeddings };
//# sourceMappingURL=GoogleVertexAIEmbedding.js.map