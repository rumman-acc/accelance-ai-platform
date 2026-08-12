import { convertMultiOptionsToStringArray, getCredentialData, getCredentialParam } from '../../../src/utils'
import { createZendeskTools } from './core'
import type { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class Zendesk_Tools implements INode {
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
        this.label = 'Zendesk'
        this.name = 'zendeskTool'
        this.version = 1.0
        this.type = 'Zendesk'
        this.icon = 'zendesk.svg'
        this.category = 'Tools'
        this.description = 'Manage Zendesk support tickets'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['zendeskApi']
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
                        label: 'Search Tickets',
                        name: 'search_tickets'
                    }
                ]
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)

        const subdomain = getCredentialParam('subdomain', credentialData, nodeData)
        const email = getCredentialParam('email', credentialData, nodeData)
        const apiToken = getCredentialParam('apiToken', credentialData, nodeData)

        if (!subdomain || !email || !apiToken) {
            throw new Error('Invalid credentials: subdomain, email, and API token are required')
        }

        const actions = convertMultiOptionsToStringArray(nodeData.inputs?.actions)

        const tools = createZendeskTools({
            actions,
            subdomain,
            email,
            apiToken
        })

        return tools
    }
}

module.exports = { nodeClass: Zendesk_Tools }
