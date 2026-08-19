'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const openai_1 = require('@langchain/openai')
const utils_1 = require('../../../src/utils')
const modelLoader_1 = require('../../../src/modelLoader')
class OpenAIEmbedding_Embeddings {
    constructor() {
        //@ts-ignore
        this.loadMethods = {
            async listModels() {
                return await (0, modelLoader_1.getModels)(modelLoader_1.MODEL_TYPE.EMBEDDING, 'openAIEmbeddings')
            }
        }
        this.label = 'OpenAI Embedding'
        this.name = 'openAIEmbeddings'
        this.version = 4.0
        this.type = 'OpenAIEmbeddings'
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
                label: 'Model Name',
                name: 'modelName',
                type: 'asyncOptions',
                loadMethod: 'listModels',
                default: 'text-embedding-ada-002'
            },
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
        const baseOptions = nodeData.inputs?.baseOptions
        const modelName = nodeData.inputs?.modelName
        const dimensions = nodeData.inputs?.dimensions
        const encodingFormat = nodeData.inputs?.encodingFormat
        if (nodeData.inputs?.credentialId) {
            nodeData.credential = nodeData.inputs?.credentialId
        }
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options)
        const openAIApiKey = (0, utils_1.getCredentialParam)('openAIApiKey', credentialData, nodeData)
        const obj = {
            openAIApiKey,
            modelName
        }
        if (stripNewLines) obj.stripNewLines = stripNewLines
        if (batchSize) obj.batchSize = parseInt(batchSize, 10)
        if (timeout) obj.timeout = parseInt(timeout, 10)
        if (dimensions) obj.dimensions = parseInt(dimensions, 10)
        if (encodingFormat) obj.encodingFormat = encodingFormat
        let parsedBaseOptions = undefined
        if (baseOptions) {
            try {
                parsedBaseOptions = typeof baseOptions === 'object' ? baseOptions : JSON.parse(baseOptions)
            } catch (exception) {
                throw new Error("Invalid JSON in the OpenAIEmbedding's BaseOptions: " + exception)
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
module.exports = { nodeClass: OpenAIEmbedding_Embeddings }
//# sourceMappingURL=OpenAIEmbedding.js.map
