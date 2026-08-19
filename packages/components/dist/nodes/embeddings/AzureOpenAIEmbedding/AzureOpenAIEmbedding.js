'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const openai_1 = require('@langchain/openai')
const utils_1 = require('../../../src/utils')
const serverCredentialsExists =
    !!process.env.AZURE_OPENAI_API_KEY &&
    !!process.env.AZURE_OPENAI_API_INSTANCE_NAME &&
    (!!process.env.AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME || !!process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME) &&
    !!process.env.AZURE_OPENAI_API_VERSION
class AzureOpenAIEmbedding_Embeddings {
    constructor() {
        this.label = 'Azure OpenAI Embedding'
        this.name = 'azureOpenAIEmbeddings'
        this.version = 2.0
        this.type = 'AzureOpenAIEmbeddings'
        this.icon = 'Azure.svg'
        this.category = 'Embeddings'
        this.description = 'Azure OpenAI API to generate embeddings for a given text'
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(openai_1.AzureOpenAIEmbeddings)]
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['azureOpenAIApi'],
            optional: serverCredentialsExists
        }
        this.inputs = [
            {
                label: 'Batch Size',
                name: 'batchSize',
                type: 'number',
                default: '100',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Timeout',
                name: 'timeout',
                type: 'number',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Base Path',
                name: 'basepath',
                type: 'string',
                optional: true,
                description: 'Override the default base URL for the API, e.g., "https://api.example.com/v2/',
                additionalParams: true
            },
            {
                label: 'Base Options',
                name: 'baseOptions',
                type: 'json',
                optional: true,
                description: 'Default headers to include with every request to the API.',
                additionalParams: true
            }
        ]
    }
    async init(nodeData, _, options) {
        const batchSize = nodeData.inputs?.batchSize
        const timeout = nodeData.inputs?.timeout
        const basePath = nodeData.inputs?.basepath
        const baseOptions = nodeData.inputs?.baseOptions
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options)
        const azureOpenAIApiKey = (0, utils_1.getCredentialParam)('azureOpenAIApiKey', credentialData, nodeData)
        const azureOpenAIApiInstanceName = (0, utils_1.getCredentialParam)('azureOpenAIApiInstanceName', credentialData, nodeData)
        const azureOpenAIApiDeploymentName = (0, utils_1.getCredentialParam)('azureOpenAIApiDeploymentName', credentialData, nodeData)
        const azureOpenAIApiVersion = (0, utils_1.getCredentialParam)('azureOpenAIApiVersion', credentialData, nodeData)
        const obj = {
            azureOpenAIApiKey,
            azureOpenAIApiInstanceName,
            azureOpenAIApiDeploymentName,
            azureOpenAIApiVersion,
            azureOpenAIBasePath: basePath || undefined
        }
        if (batchSize) obj.batchSize = parseInt(batchSize, 10)
        if (timeout) obj.timeout = parseInt(timeout, 10)
        if (baseOptions) {
            try {
                const parsedBaseOptions = typeof baseOptions === 'object' ? baseOptions : JSON.parse(baseOptions)
                obj.configuration = {
                    defaultHeaders: parsedBaseOptions
                }
            } catch (exception) {
                console.error('Error parsing base options', exception)
            }
        }
        const model = new openai_1.AzureOpenAIEmbeddings(obj)
        return model
    }
}
module.exports = { nodeClass: AzureOpenAIEmbedding_Embeddings }
//# sourceMappingURL=AzureOpenAIEmbedding.js.map
