'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const utils_1 = require('../../../src/utils')
const core_1 = require('./core')
class Telegram_Tools {
    constructor() {
        this.label = 'Telegram'
        this.name = 'telegramTool'
        this.version = 1.0
        this.type = 'Telegram'
        this.icon = 'telegram.svg'
        this.category = 'Tools'
        this.description = 'Send messages and manage a Telegram bot'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['telegramApi']
        }
        this.inputs = [
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'Send Message',
                        name: 'send_message'
                    },
                    {
                        label: 'Get Updates',
                        name: 'get_updates'
                    },
                    {
                        label: 'Get Chat',
                        name: 'get_chat'
                    },
                    {
                        label: 'Send Photo',
                        name: 'send_photo'
                    },
                    {
                        label: 'Get Me',
                        name: 'get_me'
                    }
                ]
            }
        ]
    }
    async init(nodeData, _, options) {
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options)
        const botToken = (0, utils_1.getCredentialParam)('botToken', credentialData, nodeData)
        if (!botToken) {
            throw new Error('No Telegram bot token provided')
        }
        const actions = (0, utils_1.convertMultiOptionsToStringArray)(nodeData.inputs?.actions)
        const tools = (0, core_1.createTelegramTools)({
            actions,
            botToken
        })
        return tools
    }
}
module.exports = { nodeClass: Telegram_Tools }
//# sourceMappingURL=Telegram.js.map
