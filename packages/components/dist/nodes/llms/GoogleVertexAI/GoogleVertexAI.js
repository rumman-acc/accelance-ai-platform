"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const google_vertexai_1 = require("@langchain/google-vertexai");
const utils_1 = require("../../../src/utils");
const modelLoader_1 = require("../../../src/modelLoader");
const google_utils_1 = require("../../../src/google-utils");
class GoogleVertexAI_LLMs {
    constructor() {
        //@ts-ignore
        this.loadMethods = {
            async listModels() {
                return await (0, modelLoader_1.getModels)(modelLoader_1.MODEL_TYPE.LLM, 'googlevertexai');
            }
        };
        this.label = 'GoogleVertexAI';
        this.name = 'googlevertexai';
        this.version = 3.0;
        this.type = 'GoogleVertexAI';
        this.icon = 'GoogleVertex.svg';
        this.category = 'LLMs';
        this.description = 'Wrapper around GoogleVertexAI large language models';
        this.badge = 'DEPRECATING';
        this.deprecateMessage = 'Use GoogleVertexAI Chat Models instead';
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(google_vertexai_1.VertexAI)];
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
                label: 'Cache',
                name: 'cache',
                type: 'BaseCache',
                optional: true
            },
            {
                label: 'Model Name',
                name: 'modelName',
                type: 'asyncOptions',
                loadMethod: 'listModels',
                default: 'text-bison'
            },
            {
                label: 'Temperature',
                name: 'temperature',
                type: 'number',
                step: 0.1,
                default: 0.7,
                optional: true
            },
            {
                label: 'max Output Tokens',
                name: 'maxOutputTokens',
                type: 'number',
                step: 1,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Top Probability',
                name: 'topP',
                type: 'number',
                step: 0.1,
                optional: true,
                additionalParams: true
            }
        ];
    }
    async init(nodeData, _, options) {
        const temperature = nodeData.inputs?.temperature;
        const modelName = nodeData.inputs?.modelName;
        const maxOutputTokens = nodeData.inputs?.maxOutputTokens;
        const topP = nodeData.inputs?.topP;
        const cache = nodeData.inputs?.cache;
        const obj = {
            temperature: parseFloat(temperature),
            model: modelName
        };
        const authOptions = await (0, google_utils_1.buildGoogleCredentials)(nodeData, options);
        if (authOptions && Object.keys(authOptions).length !== 0)
            obj.authOptions = authOptions;
        if (maxOutputTokens)
            obj.maxOutputTokens = parseInt(maxOutputTokens, 10);
        if (topP)
            obj.topP = parseFloat(topP);
        if (cache)
            obj.cache = cache;
        const model = new google_vertexai_1.VertexAI(obj);
        return model;
    }
}
module.exports = { nodeClass: GoogleVertexAI_LLMs };
//# sourceMappingURL=GoogleVertexAI.js.map