'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const togetherai_1 = require('@langchain/community/embeddings/togetherai')
const utils_1 = require('../../../src/utils')
class TogetherAIEmbedding_Embeddings {
    constructor() {
        this.label = 'TogetherAI Embedding'
        this.name = 'togetherAIEmbedding'
        this.version = 1.0
        this.type = 'TogetherAIEmbedding'
        this.icon = 'togetherai.png'
        this.category = 'Embeddings'
        this.description = 'TogetherAI Embedding models to generate embeddings for a given text'
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(togetherai_1.TogetherAIEmbeddings)]
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['togetherAIApi']
        }
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
                type: 'string',
                placeholder: 'sentence-transformers/msmarco-bert-base-dot-v5',
                description: 'Refer to <a target="_blank" href="https://docs.together.ai/docs/embedding-models">embedding models</a> page'
            }
        ]
    }
    async init(nodeData, _, options) {
        const modelName = nodeData.inputs?.modelName
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options)
        const togetherAIApiKey = (0, utils_1.getCredentialParam)('togetherAIApiKey', credentialData, nodeData)
        const obj = {
            modelName: modelName,
            apiKey: togetherAIApiKey,
            model: modelName
        }
        const model = new togetherai_1.TogetherAIEmbeddings(obj)
        return model
    }
}
module.exports = { nodeClass: TogetherAIEmbedding_Embeddings }
//# sourceMappingURL=TogetherAIEmbedding.js.map
