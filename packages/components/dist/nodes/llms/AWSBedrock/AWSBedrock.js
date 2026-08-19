"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bedrock_1 = require("@langchain/community/llms/bedrock");
const utils_1 = require("../../../src/utils");
const modelLoader_1 = require("../../../src/modelLoader");
const awsToolsUtils_1 = require("../../../src/awsToolsUtils");
/**
 * @author Michael Connor <mlconnor@yahoo.com>
 */
class AWSBedrock_LLMs {
    constructor() {
        //@ts-ignore
        this.loadMethods = {
            async listModels() {
                return await (0, modelLoader_1.getModels)(modelLoader_1.MODEL_TYPE.LLM, 'awsBedrock');
            },
            async listRegions() {
                return await (0, modelLoader_1.getRegions)(modelLoader_1.MODEL_TYPE.LLM, 'awsBedrock');
            }
        };
        this.label = 'AWS Bedrock';
        this.name = 'awsBedrock';
        this.version = 4.0;
        this.type = 'AWSBedrock';
        this.icon = 'aws.svg';
        this.category = 'LLMs';
        this.description = 'Wrapper around AWS Bedrock large language models';
        this.badge = 'DEPRECATING';
        this.deprecateMessage = 'Use AWS Bedrock Chat Models instead';
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(bedrock_1.Bedrock)];
        this.credential = {
            label: 'AWS Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['awsApi'],
            optional: true
        };
        this.inputs = [
            {
                label: 'Cache',
                name: 'cache',
                type: 'BaseCache',
                optional: true
            },
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
                loadMethod: 'listModels'
            },
            {
                label: 'Custom Model Name',
                name: 'customModel',
                description: 'If provided, will override model selected from Model Name option',
                type: 'string',
                optional: true
            },
            {
                label: 'Temperature',
                name: 'temperature',
                type: 'number',
                step: 0.1,
                description: 'Temperature parameter may not apply to certain model. Please check available model parameters',
                optional: true,
                additionalParams: true,
                default: 0.7
            },
            {
                label: 'Max Tokens to Sample',
                name: 'max_tokens_to_sample',
                type: 'number',
                step: 10,
                description: 'Max Tokens parameter may not apply to certain model. Please check available model parameters',
                optional: true,
                additionalParams: true,
                default: 200
            }
        ];
    }
    async init(nodeData, _, options) {
        const iRegion = nodeData.inputs?.region;
        const iModel = nodeData.inputs?.model;
        const customModel = nodeData.inputs?.customModel;
        const iTemperature = nodeData.inputs?.temperature;
        const iMax_tokens_to_sample = nodeData.inputs?.max_tokens_to_sample;
        const cache = nodeData.inputs?.cache;
        const obj = {
            model: customModel ? customModel : iModel,
            region: iRegion,
            temperature: parseFloat(iTemperature),
            maxTokens: parseInt(iMax_tokens_to_sample, 10)
        };
        /**
         * Long-term credentials specified in LLM configuration are optional.
         * Bedrock's credential provider falls back to the AWS SDK to fetch
         * credentials from the running environment.
         * When specified, we override the default provider with configured values.
         * Supports STS AssumeRole when a Role ARN is configured in the credential.
         * @see https://github.com/aws/aws-sdk-js-v3/blob/main/packages/credential-provider-node/README.md
         */
        const credentialConfig = await (0, awsToolsUtils_1.getAWSCredentialConfig)(nodeData, options, iRegion);
        if (credentialConfig.credentials) {
            obj.credentials = credentialConfig.credentials;
        }
        if (cache)
            obj.cache = cache;
        const amazonBedrock = new bedrock_1.Bedrock(obj);
        return amazonBedrock;
    }
}
module.exports = { nodeClass: AWSBedrock_LLMs };
//# sourceMappingURL=AWSBedrock.js.map