'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const baidu_qianfan_1 = require('@langchain/baidu-qianfan')
const modelLoader_1 = require('../../../src/modelLoader')
const utils_1 = require('../../../src/utils')
class BaiduQianfanEmbedding_Embeddings {
    constructor() {
        //@ts-ignore
        this.loadMethods = {
            async listModels() {
                return await (0, modelLoader_1.getModels)(modelLoader_1.MODEL_TYPE.EMBEDDING, 'baiduQianfanEmbeddings')
            }
        }
        this.label = 'Baidu Qianfan Embedding'
        this.name = 'baiduQianfanEmbeddings'
        this.version = 1.0
        this.type = 'BaiduQianfanEmbeddings'
        this.icon = 'baiduwenxin.svg'
        this.category = 'Embeddings'
        this.description = 'Baidu Qianfan API to generate embeddings for a given text'
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(baidu_qianfan_1.BaiduQianfanEmbeddings)]
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['baiduQianfanApi']
        }
        this.inputs = [
            {
                label: 'Model Name',
                name: 'modelName',
                type: 'asyncOptions',
                loadMethod: 'listModels',
                default: 'Embedding-V1'
            },
            {
                label: 'Custom Model Name',
                name: 'customModelName',
                type: 'string',
                placeholder: 'Qwen3-Embedding-4B',
                description: 'Custom model name to use. If provided, it will override the selected model.',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Strip New Lines',
                name: 'stripNewLines',
                type: 'boolean',
                optional: true,
                additionalParams: true,
                description: 'Remove new lines from input text before embedding to reduce token count'
            },
            {
                label: 'Batch Size',
                name: 'batchSize',
                type: 'number',
                optional: true,
                default: 1,
                additionalParams: true,
                description: 'Number of texts sent in each embedding request',
                warning:
                    'Qianfan has stricter limits on individual text length. If you encounter a length error, reduce chunk size to 500 and set Batch Size to 1.'
            },
            {
                label: 'Timeout',
                name: 'timeout',
                type: 'number',
                optional: true,
                additionalParams: true,
                description: 'Request timeout in milliseconds'
            }
        ]
    }
    async init(nodeData, _, options) {
        const modelName = nodeData.inputs?.modelName
        const customModelName = nodeData.inputs?.customModelName
        const stripNewLines = nodeData.inputs?.stripNewLines
        const batchSize = nodeData.inputs?.batchSize
        const timeout = nodeData.inputs?.timeout
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options)
        const qianfanAccessKey = (0, utils_1.getCredentialParam)('qianfanAccessKey', credentialData, nodeData)
        const qianfanSecretKey = (0, utils_1.getCredentialParam)('qianfanSecretKey', credentialData, nodeData)
        const obj = {
            modelName: customModelName || modelName,
            qianfanAccessKey,
            qianfanSecretKey
        }
        if (typeof stripNewLines === 'boolean') obj.stripNewLines = stripNewLines
        if (batchSize !== undefined && batchSize !== null && batchSize !== '') obj.batchSize = parseInt(batchSize, 10)
        if (timeout !== undefined && timeout !== null && timeout !== '') obj.timeout = parseInt(timeout, 10)
        const model = new baidu_qianfan_1.BaiduQianfanEmbeddings(obj)
        return model
    }
}
module.exports = { nodeClass: BaiduQianfanEmbedding_Embeddings }
//# sourceMappingURL=BaiduQianfanEmbedding.js.map
