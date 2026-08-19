"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_bedrock_runtime_1 = require("@aws-sdk/client-bedrock-runtime");
const aws_1 = require("@langchain/aws");
const utils_1 = require("../../../src/utils");
const awsToolsUtils_1 = require("../../../src/awsToolsUtils");
const modelLoader_1 = require("../../../src/modelLoader");
class AWSBedrockEmbedding_Embeddings {
    constructor() {
        this.loadMethods = {
            async listModels() {
                return await (0, modelLoader_1.getModels)(modelLoader_1.MODEL_TYPE.EMBEDDING, 'AWSBedrockEmbeddings');
            },
            async listRegions() {
                return await (0, modelLoader_1.getRegions)(modelLoader_1.MODEL_TYPE.EMBEDDING, 'AWSBedrockEmbeddings');
            }
        };
        this.label = 'AWS Bedrock Embedding';
        this.name = 'AWSBedrockEmbeddings';
        this.version = 5.1;
        this.type = 'AWSBedrockEmbeddings';
        this.icon = 'aws.svg';
        this.category = 'Embeddings';
        this.description = 'AWSBedrock embedding models to generate embeddings for a given text';
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(aws_1.BedrockEmbeddings)];
        this.credential = {
            label: 'AWS Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['awsApi'],
            optional: true
        };
        this.inputs = [
            {
                label: 'Region',
                name: 'region',
                type: 'asyncOptions',
                loadMethod: 'listRegions',
                default: 'us-east-1'
            },
            {
                label: 'Model Name',
                name: 'model',
                type: 'asyncOptions',
                loadMethod: 'listModels',
                default: 'amazon.titan-embed-text-v1'
            },
            {
                label: 'Custom Model Name',
                name: 'customModel',
                description: 'If provided, will override model selected from Model Name option',
                type: 'string',
                optional: true
            },
            {
                label: 'Custom Endpoint Host',
                name: 'endpointHost',
                type: 'string',
                description: 'Custom endpoint host to use for the model. Provide the hostname without scheme. If provided, will override the default endpoint host.',
                optional: true
            },
            {
                label: 'Cohere Input Type',
                name: 'inputType',
                type: 'options',
                description: 'Specifies the type of input passed to the model. Required for cohere embedding models v3 and higher. <a target="_blank" href="https://docs.cohere.com/reference/embed">Official Docs</a>',
                options: [
                    {
                        label: 'search_document',
                        name: 'search_document',
                        description: 'Use this to encode documents for embeddings that you store in a vector database for search use-cases'
                    },
                    {
                        label: 'search_query',
                        name: 'search_query',
                        description: 'Use this when you query your vector DB to find relevant documents.'
                    },
                    {
                        label: 'classification',
                        name: 'classification',
                        description: 'Use this when you use the embeddings as an input to a text classifier'
                    },
                    {
                        label: 'clustering',
                        name: 'clustering',
                        description: 'Use this when you want to cluster the embeddings.'
                    }
                ],
                optional: true
            },
            {
                label: 'Batch Size',
                name: 'batchSize',
                description: 'Documents batch size to send to AWS API for Titan model embeddings. Used to avoid throttling.',
                type: 'number',
                optional: true,
                default: 50,
                additionalParams: true
            },
            {
                label: 'Max AWS API retries',
                name: 'maxRetries',
                description: 'This will limit the number of AWS API for Titan model embeddings call retries. Used to avoid throttling.',
                type: 'number',
                optional: true,
                default: 5,
                additionalParams: true
            }
        ];
    }
    async init(nodeData, _, options) {
        const iRegion = nodeData.inputs?.region;
        const iModel = nodeData.inputs?.model;
        const customModel = nodeData.inputs?.customModel;
        const inputType = nodeData.inputs?.inputType;
        const endpointHost = nodeData.inputs?.endpointHost?.trim();
        const effectiveModel = customModel || iModel;
        if (!effectiveModel)
            throw new Error('Model ID is required');
        if (effectiveModel.startsWith('cohere') && !inputType) {
            throw new Error('Input Type must be selected for Cohere models.');
        }
        const obj = {
            model: effectiveModel,
            region: iRegion
        };
        /**
         * Long-term credentials specified in embedding configuration are optional.
         * Bedrock's credential provider falls back to the AWS SDK to fetch
         * credentials from the running environment.
         * Supports STS AssumeRole when a Role ARN is configured in the credential.
         */
        const credentialConfig = await (0, awsToolsUtils_1.getAWSCredentialConfig)(nodeData, options, iRegion);
        if (credentialConfig.credentials) {
            obj.credentials = credentialConfig.credentials;
        }
        const clientConfig = {
            region: obj.region,
            credentials: obj.credentials
        };
        if (endpointHost) {
            // Accept the same host-only contract as the AWS Chat Bedrock node, but tolerate a full URL
            // so users who paste `https://...` are not broken. AWS SDK v3's BedrockRuntimeClient
            // requires a full URL (scheme + host) on the `endpoint` option.
            clientConfig.endpoint = /^https?:\/\//i.test(endpointHost) ? endpointHost : `https://${endpointHost}`;
        }
        const client = new client_bedrock_runtime_1.BedrockRuntimeClient(clientConfig);
        // Share the configured client with BedrockEmbeddings so any code path that doesn't go
        // through our overridden embedQuery / embedDocuments still uses the custom endpoint
        // (and credentials/region) we configured above.
        obj.client = client;
        const model = new aws_1.BedrockEmbeddings(obj);
        model.embedQuery = async (document) => {
            if (effectiveModel.startsWith('cohere')) {
                const embeddings = await embedTextCohere([document], client, effectiveModel, inputType);
                return embeddings[0];
            }
            else {
                return await embedTextTitan(document, client, effectiveModel);
            }
        };
        model.embedDocuments = async (documents) => {
            if (effectiveModel.startsWith('cohere')) {
                return await embedTextCohere(documents, client, effectiveModel, inputType);
            }
            else {
                const batchSize = nodeData.inputs?.batchSize;
                const maxRetries = nodeData.inputs?.maxRetries;
                return processInBatches(documents, batchSize, maxRetries, (document) => embedTextTitan(document, client, effectiveModel));
            }
        };
        return model;
    }
}
const embedTextTitan = async (text, client, model) => {
    const cleanedText = text.replace(/\n/g, ' ');
    const res = await client.send(new client_bedrock_runtime_1.InvokeModelCommand({
        modelId: model,
        body: JSON.stringify({
            inputText: cleanedText
        }),
        contentType: 'application/json',
        accept: 'application/json'
    }));
    try {
        const body = new TextDecoder().decode(res.body);
        return JSON.parse(body).embedding;
    }
    catch (e) {
        throw new Error('An invalid response was returned by Bedrock.');
    }
};
const embedTextCohere = async (texts, client, model, inputType) => {
    const cleanedTexts = texts.map((text) => text.replace(/\n/g, ' '));
    const command = {
        modelId: model,
        body: JSON.stringify({
            texts: cleanedTexts,
            input_type: inputType,
            truncate: 'END'
        }),
        contentType: 'application/json',
        accept: 'application/json'
    };
    const res = await client.send(new client_bedrock_runtime_1.InvokeModelCommand(command));
    try {
        const body = new TextDecoder().decode(res.body);
        return JSON.parse(body).embeddings;
    }
    catch (e) {
        throw new Error('An invalid response was returned by Bedrock.');
    }
};
const processInBatches = async (documents, batchSize, maxRetries, processFunc) => {
    let sleepTime = 0;
    let retryCounter = 0;
    let result = [];
    for (let i = 0; i < documents.length; i += batchSize) {
        let chunk = documents.slice(i, i + batchSize);
        try {
            let chunkResult = await Promise.all(chunk.map(processFunc));
            result.push(...chunkResult);
            retryCounter = 0;
        }
        catch (e) {
            if (retryCounter < maxRetries && e.name.includes('ThrottlingException')) {
                retryCounter = retryCounter + 1;
                i = i - batchSize;
                sleepTime = sleepTime + 100;
            }
            else {
                // Split to distinguish between throttling retry error and other errors in trance
                if (e.name.includes('ThrottlingException')) {
                    throw new Error('AWS Bedrock retry limit reached: ' + e);
                }
                else {
                    throw new Error(e);
                }
            }
        }
        await new Promise((resolve) => setTimeout(resolve, sleepTime));
    }
    return result;
};
module.exports = { nodeClass: AWSBedrockEmbedding_Embeddings };
//# sourceMappingURL=AWSBedrockEmbedding.js.map