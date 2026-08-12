import { convertMultiOptionsToStringArray, getCredentialData, getCredentialParam } from '../../../src/utils'
import { createTrelloTools } from './core'
import type { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class Trello_Tools implements INode {
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
        this.label = 'Trello'
        this.name = 'trelloTool'
        this.version = 1.0
        this.type = 'Trello'
        this.icon = 'trello.svg'
        this.category = 'Tools'
        this.description = 'Manage Trello boards and cards'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['trelloApi']
        }
        this.inputs = [
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'List Boards',
                        name: 'list_boards'
                    },
                    {
                        label: 'List Cards',
                        name: 'list_cards'
                    },
                    {
                        label: 'Create Card',
                        name: 'create_card'
                    },
                    {
                        label: 'Get Card',
                        name: 'get_card'
                    },
                    {
                        label: 'Update Card',
                        name: 'update_card'
                    }
                ]
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const apiKey = getCredentialParam('apiKey', credentialData, nodeData)
        const apiToken = getCredentialParam('apiToken', credentialData, nodeData)

        if (!apiKey || !apiToken) {
            throw new Error('Invalid credentials: provide both API Key and API Token')
        }

        const actions = convertMultiOptionsToStringArray(nodeData.inputs?.actions)

        const tools = createTrelloTools({
            actions,
            apiKey,
            apiToken
        })

        return tools
    }
}

module.exports = { nodeClass: Trello_Tools }
