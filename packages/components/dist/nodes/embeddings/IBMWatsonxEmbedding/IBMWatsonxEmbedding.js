'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const ibm_1 = require('@langchain/community/embeddings/ibm')
const utils_1 = require('../../../src/utils')
class IBMWatsonx_Embeddings {
    constructor() {
        this.label = 'IBM Watsonx Embedding'
        this.name = 'ibmEmbedding'
        this.version = 1.0
        this.type = 'WatsonxEmbeddings'
        this.icon = 'ibm.png'
        this.category = 'Embeddings'
        this.description = 'Generate embeddings for a given text using open source model on IBM Watsonx'
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(ibm_1.WatsonxEmbeddings)]
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['ibmWatsonx']
        }
        this.inputs = [
            {
                label: 'Model Name',
                name: 'modelName',
                type: 'string',
                default: 'ibm/slate-30m-english-rtrvr'
            },
            {
                label: 'Truncate Input Tokens',
                name: 'truncateInputTokens',
                type: 'number',
                description: 'Truncate the input tokens.',
                step: 1,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Max Retries',
                name: 'maxRetries',
                type: 'number',
                description: 'The maximum number of retries.',
                step: 1,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Max Concurrency',
                name: 'maxConcurrency',
                type: 'number',
                description: 'The maximum number of concurrencies.',
                step: 1,
                optional: true,
                additionalParams: true
            }
        ]
    }
    async init(nodeData, _, options) {
        const modelName = nodeData.inputs?.modelName
        const truncateInputTokens = nodeData.inputs?.truncateInputTokens
        const maxRetries = nodeData.inputs?.maxRetries
        const maxConcurrency = nodeData.inputs?.maxConcurrency
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options)
        const version = (0, utils_1.getCredentialParam)('version', credentialData, nodeData)
        const serviceUrl = (0, utils_1.getCredentialParam)('serviceUrl', credentialData, nodeData)
        const projectId = (0, utils_1.getCredentialParam)('projectId', credentialData, nodeData)
        const watsonxAIAuthType = (0, utils_1.getCredentialParam)('watsonxAIAuthType', credentialData, nodeData)
        const watsonxAIApikey = (0, utils_1.getCredentialParam)('watsonxAIApikey', credentialData, nodeData)
        const watsonxAIBearerToken = (0, utils_1.getCredentialParam)('watsonxAIBearerToken', credentialData, nodeData)
        const auth = {
            version,
            serviceUrl,
            projectId,
            watsonxAIAuthType,
            watsonxAIApikey,
            watsonxAIBearerToken
        }
        const obj = {
            ...auth,
            model: modelName
        }
        if (truncateInputTokens) obj.truncateInputTokens = parseInt(truncateInputTokens, 10)
        if (maxRetries) obj.maxRetries = parseInt(maxRetries, 10)
        if (maxConcurrency) obj.maxConcurrency = parseInt(maxConcurrency, 10)
        const model = new ibm_1.WatsonxEmbeddings(obj)
        return model
    }
}
module.exports = { nodeClass: IBMWatsonx_Embeddings }
//# sourceMappingURL=IBMWatsonxEmbedding.js.map
