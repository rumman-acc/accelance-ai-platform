import { convertMultiOptionsToStringArray, getCredentialData, getCredentialParam } from '../../../src/utils'
import { createFreshdeskTools } from './core'
import type { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class Freshdesk_Tools implements INode {
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
        this.label = 'Freshdesk'
        this.name = 'freshdeskTool'
        this.version = 1.0
        this.type = 'Freshdesk'
        this.icon = 'freshdesk.svg'
        this.category = 'Tools'
        this.description = 'Manage Freshdesk support tickets and contacts'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['freshdeskApi']
        }
        this.inputs = [
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'List Tickets',
                        name: 'list_tickets'
                    },
                    {
                        label: 'Create Ticket',
                        name: 'create_ticket'
                    },
                    {
                        label: 'Get Ticket',
                        name: 'get_ticket'
                    },
                    {
                        label: 'Update Ticket',
                        name: 'update_ticket'
                    },
                    {
                        label: 'List Contacts',
                        name: 'list_contacts'
                    }
                ]
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const domain = getCredentialParam('domain', credentialData, nodeData)
        const apiKey = getCredentialParam('apiKey', credentialData, nodeData)

        if (!domain || !apiKey) {
            throw new Error('Invalid credentials: provide Domain and API Key')
        }

        const actions = convertMultiOptionsToStringArray(nodeData.inputs?.actions)

        const tools = createFreshdeskTools({
            actions,
            domain,
            apiKey
        })

        return tools
    }
}

module.exports = { nodeClass: Freshdesk_Tools }
