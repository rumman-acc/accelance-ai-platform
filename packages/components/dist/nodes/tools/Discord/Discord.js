'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const utils_1 = require('../../../src/utils')
const core_1 = require('./core')
class Discord_Tools {
    constructor() {
        this.label = 'Discord'
        this.name = 'discordTool'
        this.version = 1.0
        this.type = 'Discord'
        this.icon = 'discord.svg'
        this.category = 'Tools'
        this.description = 'Send messages and manage channels in a Discord server via a bot'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['discordApi']
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
                        label: 'List Channel Messages',
                        name: 'list_channel_messages'
                    },
                    {
                        label: 'List Guild Channels',
                        name: 'list_guild_channels'
                    },
                    {
                        label: 'Create Channel',
                        name: 'create_channel'
                    },
                    {
                        label: 'Get Channel',
                        name: 'get_channel'
                    }
                ]
            }
        ]
    }
    async init(nodeData, _, options) {
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options)
        const botToken = (0, utils_1.getCredentialParam)('botToken', credentialData, nodeData)
        if (!botToken) {
            throw new Error('No Discord bot token provided')
        }
        const actions = (0, utils_1.convertMultiOptionsToStringArray)(nodeData.inputs?.actions)
        const tools = (0, core_1.createDiscordTools)({
            actions,
            botToken
        })
        return tools
    }
}
module.exports = { nodeClass: Discord_Tools }
//# sourceMappingURL=Discord.js.map
