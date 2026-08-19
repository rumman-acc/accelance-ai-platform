'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const src_1 = require('../../../src')
const openai_1 = require('@langchain/openai')
class Sambanova_LLMs {
    constructor() {
        this.label = 'Sambanova'
        this.name = 'sambanova'
        this.version = 1.0
        this.type = 'Sambanova'
        this.icon = 'sambanova.png'
        this.category = 'LLMs'
        this.description = 'Wrapper around Sambanova API for large language models'
        this.badge = 'DEPRECATING'
        this.deprecateMessage = 'Use Sambanova Chat Models instead'
        this.baseClasses = [this.type, ...(0, src_1.getBaseClasses)(openai_1.OpenAI)]
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['sambanovaApi']
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
                default: 'Meta-Llama-3.3-70B-Instruct',
                description: 'For more details see https://docs.sambanova.ai/cloud/docs/get-started/supported-models',
                optional: true
            }
        ]
    }
    async init(nodeData, _, options) {
        const cache = nodeData.inputs?.cache
        const modelName = nodeData.inputs?.modelName
        const credentialData = await (0, src_1.getCredentialData)(nodeData.credential ?? '', options)
        const sambanovaKey = (0, src_1.getCredentialParam)('sambanovaApiKey', credentialData, nodeData)
        const obj = {
            model: modelName,
            configuration: {
                baseURL: 'https://api.sambanova.ai/v1',
                apiKey: sambanovaKey
            }
        }
        if (cache) obj.cache = cache
        const sambanova = new openai_1.OpenAI(obj)
        return sambanova
    }
}
module.exports = { nodeClass: Sambanova_LLMs }
//# sourceMappingURL=Sambanova.js.map
