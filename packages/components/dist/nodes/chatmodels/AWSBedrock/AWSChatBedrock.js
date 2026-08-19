'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const utils_1 = require('../../../src/utils')
const modelLoader_1 = require('../../../src/modelLoader')
const awsToolsUtils_1 = require('../../../src/awsToolsUtils')
const aws_1 = require('@langchain/aws')
const FlowiseAWSChatBedrock_1 = require('./FlowiseAWSChatBedrock')
const utils_2 = require('./utils')
const FlowiseAWSChatBedrockImported_1 = require('./FlowiseAWSChatBedrockImported')
const anthropicUtils_1 = require('../../../src/anthropicUtils')
class AWSChatBedrock_ChatModels {
    constructor() {
        //@ts-ignore
        this.loadMethods = {
            async listModels() {
                return await (0, modelLoader_1.getModels)(modelLoader_1.MODEL_TYPE.CHAT, 'awsChatBedrock')
            },
            async listRegions() {
                return await (0, modelLoader_1.getRegions)(modelLoader_1.MODEL_TYPE.CHAT, 'awsChatBedrock')
            }
        }
        this.label = 'AWS Bedrock'
        this.name = 'awsChatBedrock'
        this.version = 6.1
        this.type = 'AWSChatBedrock'
        this.icon = 'aws.svg'
        this.category = 'Chat Models'
        this.description =
            'Wrapper around AWS Bedrock large language models. Supports built-in, imported, fine-tuned, and provisioned-throughput models.'
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(aws_1.ChatBedrockConverse)]
        this.credential = {
            label: 'AWS Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['awsApi'],
            optional: true
        }
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
                loadMethod: 'listModels',
                default: 'anthropic.claude-haiku-4-5-20251001-v1:0',
                optional: true
            },
            {
                label: 'Custom Model ARN',
                name: 'customModel',
                description:
                    'For imported, fine-tuned, or provisioned-throughput models. ' +
                    'Enter the full ARN. Imported models are auto-detected and routed to the correct API. ' +
                    'For fine-tuned models, use the deployment ARN (custom-model-deployment/... for on-demand, ' +
                    'or provisioned-model/... for Provisioned Throughput) — the raw custom-model/... artifact ARN is not invokable. ' +
                    'For built-in models, use the dropdown above instead.',
                placeholder: 'arn:aws:bedrock:us-east-1:123456:imported-model/my-model',
                type: 'string',
                optional: true
            },
            {
                label: 'Custom Endpoint Host',
                name: 'endpointHost',
                type: 'string',
                description:
                    'Hostname-only override for a custom VPC endpoint or proxy ' +
                    '(e.g. bedrock-runtime.us-east-1.amazonaws.com). ' +
                    'Do NOT enter model ARNs or inference profile IDs here.',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Streaming',
                name: 'streaming',
                type: 'boolean',
                default: true,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Allow Image Uploads',
                name: 'allowImageUploads',
                type: 'boolean',
                description:
                    'Allow image input. Refer to the <a href="https://docs.flowiseai.com/using-flowise/uploads#image" target="_blank">docs</a> for more details.',
                default: false,
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
            },
            {
                label: 'Latency Optimized',
                name: 'latencyOptimized',
                type: 'boolean',
                description:
                    'Enable latency optimized configuration for supported models. Refer to the supported <a href="https://docs.aws.amazon.com/bedrock/latest/userguide/latency-optimized-inference.html" target="_blank">latecny optimized models</a> for more details.',
                default: false,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Use Global Inference Endpoint',
                name: 'useGlobalEndpoint',
                type: 'boolean',
                description:
                    'Force the global cross-region inference profile instead of the region-specific one. ' +
                    'Bedrock routes dynamically across regions for maximum availability.',
                default: false,
                optional: true,
                additionalParams: true
            }
        ]
    }
    /**
     * Initializes a BedrockChat instance for the Converse API.
     *
     * Flow:
     * 1. Sanitize endpointHost (auto-migrate ARNs placed there by mistake)
     * 2. Resolve AWS credentials (UI creds, AssumeRole, or SDK default chain)
     * 3. Discover inference profiles available in the target region (cached)
     * 4. Resolve model ID + optional inference profile from user input
     * 5. Build ChatBedrockConverseInput and return BedrockChat instance
     *
     * Credentials are resolved BEFORE model resolution so that
     * discoverInferenceProfiles() can reuse the same creds.
     *
     * @see https://docs.aws.amazon.com/bedrock/latest/userguide/conversation-inference.html
     */
    async init(nodeData, _, options) {
        const iRegion = nodeData.inputs?.region
        const iModel = nodeData.inputs?.model
        const customModel = nodeData.inputs?.customModel
        const iTemperature = nodeData.inputs?.temperature
        const iMax_tokens_to_sample = nodeData.inputs?.max_tokens_to_sample
        const cache = nodeData.inputs?.cache
        const streaming = nodeData.inputs?.streaming
        const latencyOptimized = nodeData.inputs?.latencyOptimized
        const useGlobalEndpoint = nodeData.inputs?.useGlobalEndpoint
        const endpointHost = nodeData.inputs?.endpointHost?.trim()
        let sanitizedEndpointHost
        let endpointMigratedArn
        if (endpointHost) {
            const result = (0, utils_2.validateEndpointHost)(endpointHost)
            sanitizedEndpointHost = result.hostname
            endpointMigratedArn = result.migratedArn
        }
        /**
         * Long-term credentials specified in LLM configuration are optional.
         * Bedrock's credential provider falls back to the AWS SDK to fetch
         * credentials from the running environment.
         * When specified, we override the default provider with configured values.
         * Supports STS AssumeRole when a Role ARN is configured in the credential.
         * @see https://github.com/aws/aws-sdk-js-v3/blob/main/packages/credential-provider-node/README.md
         */
        const credentialConfig = await (0, awsToolsUtils_1.getAWSCredentialConfig)(nodeData, options, iRegion)
        const effectiveModel = endpointMigratedArn || customModel
        if (effectiveModel && !effectiveModel.startsWith('arn:aws:bedrock:')) {
            throw new Error(
                `"${effectiveModel}" is not a valid ARN. ` +
                    `The "Custom Model ARN" field requires a full Bedrock ARN ` +
                    `(e.g. arn:aws:bedrock:us-east-1:123456789000:imported-model/my-model). ` +
                    `For built-in models, use the "Model Name" dropdown instead.`
            )
        }
        // Auto-detect imported models and route to InvokeModel API.
        if (effectiveModel?.includes(':imported-model/')) {
            const modelInfo = await (0, FlowiseAWSChatBedrockImported_1.getImportedModelInfo)(
                effectiveModel,
                iRegion,
                credentialConfig.credentials
            )
            if (modelInfo.instructSupported !== true) {
                const format = (0, FlowiseAWSChatBedrockImported_1.detectFormat)(modelInfo.supportedFormats)
                const chat = new FlowiseAWSChatBedrockImported_1.BedrockImportedChat(nodeData.id, {
                    region: iRegion,
                    modelId: effectiveModel,
                    format,
                    temperature: !isNaN(parseFloat(iTemperature)) ? parseFloat(iTemperature) : 0.7,
                    maxTokens: !isNaN(parseInt(iMax_tokens_to_sample, 10)) ? parseInt(iMax_tokens_to_sample, 10) : 200,
                    streaming: streaming ?? true,
                    credentials: credentialConfig.credentials
                })
                const multiModalOption = {
                    image: { allowImageUploads: nodeData.inputs?.allowImageUploads ?? false }
                }
                chat.setMultiModalOption(multiModalOption)
                return chat
            }
            // instructSupported: true — fall through to Converse path
        }
        // Discover which inference profiles actually exist in this region.
        // Uses the same credentials the user configured (UI, AssumeRole, or SDK default).
        const availableProfiles = await (0, utils_2.discoverInferenceProfiles)(iRegion, credentialConfig.credentials)
        // Resolve model ID and optional inference profile from customModel input.
        // If an ARN was auto-migrated from endpointHost, it takes precedence
        // over customModel because the original flow was misconfigured --
        // the ARN was the real model target, customModel was likely a
        // friendly label (e.g. "nova-custom") that isn't a valid Bedrock ID.
        const effectiveCustomModel = endpointMigratedArn || customModel
        const { modelId, applicationInferenceProfile } = await (0, utils_2.resolveBedrockModel)(
            effectiveCustomModel,
            iModel,
            iRegion,
            availableProfiles,
            useGlobalEndpoint
        )
        const obj = {
            region: iRegion,
            model: modelId,
            maxTokens: !isNaN(parseInt(iMax_tokens_to_sample, 10)) ? parseInt(iMax_tokens_to_sample, 10) : 200,
            streaming: streaming ?? true
        }
        // Newer Anthropic Claude models (Opus 4.7+) don't accept sampling
        // parameters. AWS Bedrock surfaces those models with names like
        // "anthropic.claude-opus-4-7-v1" or "us.anthropic.claude-opus-4-7-...".
        if ((0, anthropicUtils_1.supportsSamplingParams)(modelId)) {
            obj.temperature = !isNaN(parseFloat(iTemperature)) ? parseFloat(iTemperature) : 0.7
        }
        if (applicationInferenceProfile) {
            obj.applicationInferenceProfile = applicationInferenceProfile
        }
        if (latencyOptimized) {
            obj.performanceConfig = { latency: 'optimized' }
        }
        if (sanitizedEndpointHost) {
            obj.endpointHost = sanitizedEndpointHost
        }
        if (credentialConfig.credentials) {
            obj.credentials = credentialConfig.credentials
        }
        if (cache) obj.cache = cache
        const allowImageUploads = nodeData.inputs?.allowImageUploads
        const multiModalOption = {
            image: {
                allowImageUploads: allowImageUploads ?? false
            }
        }
        const stopSeqUnsupported = await (0, utils_2.getStopSeqUnsupportedModels)()
        const amazonBedrock = new FlowiseAWSChatBedrock_1.BedrockChat(nodeData.id, obj, stopSeqUnsupported)
        amazonBedrock.setMultiModalOption(multiModalOption)
        return amazonBedrock
    }
}
module.exports = { nodeClass: AWSChatBedrock_ChatModels }
//# sourceMappingURL=AWSChatBedrock.js.map
