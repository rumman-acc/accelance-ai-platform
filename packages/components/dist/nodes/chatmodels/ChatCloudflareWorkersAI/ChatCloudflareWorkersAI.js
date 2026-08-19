'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const cloudflare_1 = require('@langchain/cloudflare')
const utils_1 = require('../../../src/utils')
class ChatCloudflareWorkersAI_ChatModels {
    constructor() {
        this.label = 'Cloudflare Workers AI'
        this.name = 'chatCloudflareWorkersAI'
        this.version = 1.0
        this.type = 'ChatCloudflareWorkersAI'
        this.icon = 'cloudflare.svg'
        this.category = 'Chat Models'
        this.description = 'Wrapper around Cloudflare Workers AI chat models'
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(cloudflare_1.ChatCloudflareWorkersAI)]
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['cloudflareApi']
        }
        this.inputs = [
            {
                label: 'Model',
                name: 'model',
                type: 'string',
                default: '@cf/meta/llama-3.1-8b-instruct-fast',
                description: 'Model to use, e.g. @cf/meta/llama-3.1-8b-instruct-fast'
            },
            {
                label: 'Base URL',
                name: 'baseUrl',
                type: 'string',
                description: 'Base URL for Cloudflare Workers AI. Defaults to https://api.cloudflare.com/client/v4/accounts',
                optional: true,
                additionalParams: true
            }
        ]
    }
    async init(nodeData, _, options) {
        const model = nodeData.inputs?.model
        const baseUrl = nodeData.inputs?.baseUrl
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options)
        const cloudflareAccountId = (0, utils_1.getCredentialParam)('cloudflareAccountId', credentialData, nodeData)
        if (!cloudflareAccountId) {
            throw new Error('Cloudflare Account ID is missing in credential.')
        }
        const cloudflareApiToken = (0, utils_1.getCredentialParam)('cloudflareApiToken', credentialData, nodeData)
        if (!cloudflareApiToken) {
            throw new Error('Cloudflare API Token is missing in credential.')
        }
        const obj = {
            cloudflareAccountId,
            cloudflareApiToken,
            model
        }
        if (baseUrl) {
            obj.baseUrl = baseUrl
        }
        const chatModel = new cloudflare_1.ChatCloudflareWorkersAI(obj)
        return chatModel
    }
}
module.exports = { nodeClass: ChatCloudflareWorkersAI_ChatModels }
//# sourceMappingURL=ChatCloudflareWorkersAI.js.map
