import { convertMultiOptionsToStringArray, getCredentialData, getCredentialParam } from '../../../src/utils'
import { createDiscordTools } from './core'
import type { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class Discord_Tools implements INode {
    label: string
    name: string
    version: number
    type: string
    icon: string
    category: string
    description: string
    baseClasses: string[]
    credential: INodeParams
    inputs: INodeParams[]

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

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const botToken = getCredentialParam('botToken', credentialData, nodeData)

        if (!botToken) {
            throw new Error('No Discord bot token provided')
        }

        const actions = convertMultiOptionsToStringArray(nodeData.inputs?.actions)

        const tools = createDiscordTools({
            actions,
            botToken
        })

        return tools
    }
}

module.exports = { nodeClass: Discord_Tools }
