'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const openai_1 = require('@langchain/openai')
const utils_1 = require('../../../src/utils')
class OpenAIEmbeddingCustom_Embeddings {
    constructor() {
        this.label = 'OpenAI Custom Embedding'
        this.name = 'openAIEmbeddingsCustom'
        this.version = 3.0
        this.type = 'OpenAIEmbeddingsCustom'
        this.icon = 'openai.svg'
        this.category = 'Embeddings'
        this.description = 'OpenAI API to generate embeddings for a given text'
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(openai_1.OpenAIEmbeddings)]
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['openAIApi']
        }
        this.inputs = [
            {
                label: 'Strip New Lines',
                name: 'stripNewLines',
                type: 'boolean',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Batch Size',
                name: 'batchSize',
                type: 'number',
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
            },
            {
                label: 'Model Name',
                name: 'modelName',
                type: 'string',
                optional: true
            },
            {
                label: 'Dimensions',
                name: 'dimensions',
                type: 'number',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Encoding Format',
                name: 'encodingFormat',
                type: 'options',
                options: [
                    {
                        label: 'float',
                        name: 'float'
                    },
                    {
                        label: 'base64',
                        name: 'base64'
                    }
                ],
                optional: true,
                additionalParams: true
            }
        ]
    }
    async init(nodeData, _, options) {
        const stripNewLines = nodeData.inputs?.stripNewLines
        const batchSize = nodeData.inputs?.batchSize
        const timeout = nodeData.inputs?.timeout
        const basePath = nodeData.inputs?.basepath
        const modelName = nodeData.inputs?.modelName
        const dimensions = nodeData.inputs?.dimensions
        const baseOptions = nodeData.inputs?.baseOptions
        const encodingFormat = nodeData.inputs?.encodingFormat
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options)
        const openAIApiKey = (0, utils_1.getCredentialParam)('openAIApiKey', credentialData, nodeData)
        const obj = {
            openAIApiKey
        }
        if (stripNewLines) obj.stripNewLines = stripNewLines
        if (batchSize) obj.batchSize = parseInt(batchSize, 10)
        if (timeout) obj.timeout = parseInt(timeout, 10)
        if (modelName) obj.modelName = modelName
        if (dimensions) obj.dimensions = parseInt(dimensions, 10)
        if (encodingFormat) obj.encodingFormat = encodingFormat
        let parsedBaseOptions = undefined
        if (baseOptions) {
            try {
                parsedBaseOptions = typeof baseOptions === 'object' ? baseOptions : JSON.parse(baseOptions)
            } catch (exception) {
                throw new Error("Invalid JSON in the ChatOpenAI's BaseOptions: " + exception)
            }
        }
        if (basePath || parsedBaseOptions) {
            obj.configuration = {
                baseURL: basePath,
                defaultHeaders: parsedBaseOptions
            }
        }
        const model = new openai_1.OpenAIEmbeddings(obj)
        return model
    }
}
module.exports = { nodeClass: OpenAIEmbeddingCustom_Embeddings }
//# sourceMappingURL=OpenAIEmbeddingCustom.js.map
