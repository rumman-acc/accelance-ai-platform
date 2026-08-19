'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const alibaba_tongyi_1 = require('@langchain/community/chat_models/alibaba_tongyi')
const utils_1 = require('../../../src/utils')
class ChatAlibabaTongyi_ChatModels {
    constructor() {
        this.label = 'Alibaba Tongyi'
        this.name = 'chatAlibabaTongyi'
        this.version = 2.0
        this.type = 'ChatAlibabaTongyi'
        this.icon = 'alibaba-svgrepo-com.svg'
        this.category = 'Chat Models'
        this.description = 'Wrapper around Alibaba Tongyi Chat Endpoints'
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(alibaba_tongyi_1.ChatAlibabaTongyi)]
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['AlibabaApi']
        }
        this.inputs = [
            {
                label: 'Cache',
                name: 'cache',
                type: 'BaseCache',
                optional: true
            },
            {
                label: 'Model',
                name: 'modelName',
                type: 'string',
                placeholder: 'qwen-plus'
            },
            {
                label: 'Temperature',
                name: 'temperature',
                type: 'number',
                step: 0.1,
                default: 0.9,
                optional: true
            },
            {
                label: 'Streaming',
                name: 'streaming',
                type: 'boolean',
                default: true,
                optional: true
            }
        ]
    }
    async init(nodeData, _, options) {
        const cache = nodeData.inputs?.cache
        const temperature = nodeData.inputs?.temperature
        const modelName = nodeData.inputs?.modelName
        const streaming = nodeData.inputs?.streaming
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options)
        const alibabaApiKey = (0, utils_1.getCredentialParam)('alibabaApiKey', credentialData, nodeData)
        const obj = {
            streaming: streaming ?? true,
            alibabaApiKey,
            model: modelName,
            temperature: temperature ? parseFloat(temperature) : undefined
        }
        if (cache) obj.cache = cache
        const model = new alibaba_tongyi_1.ChatAlibabaTongyi(obj)
        return model
    }
}
module.exports = { nodeClass: ChatAlibabaTongyi_ChatModels }
//# sourceMappingURL=ChatAlibabaTongyi.js.map
