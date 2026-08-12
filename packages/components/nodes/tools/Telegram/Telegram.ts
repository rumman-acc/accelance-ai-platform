import { convertMultiOptionsToStringArray, getCredentialData, getCredentialParam } from '../../../src/utils'
import { createTelegramTools } from './core'
import type { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class Telegram_Tools implements INode {
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

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const botToken = getCredentialParam('botToken', credentialData, nodeData)

        if (!botToken) {
            throw new Error('No Telegram bot token provided')
        }

        const actions = convertMultiOptionsToStringArray(nodeData.inputs?.actions)

        const tools = createTelegramTools({
            actions,
            botToken
        })

        return tools
    }
}

module.exports = { nodeClass: Telegram_Tools }
