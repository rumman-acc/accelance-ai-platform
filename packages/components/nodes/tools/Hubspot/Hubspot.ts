import { convertMultiOptionsToStringArray, getCredentialData, getCredentialParam } from '../../../src/utils'
import { createHubspotTools } from './core'
import type { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class Hubspot_Tools implements INode {
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
        this.label = 'HubSpot'
        this.name = 'hubspotTool'
        this.version = 1.0
        this.type = 'HubSpot'
        this.icon = 'hubspot.svg'
        this.category = 'Tools'
        this.description = 'Manage HubSpot CRM contacts and deals'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['hubspotApi']
        }
        this.inputs = [
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'List Contacts',
                        name: 'list_contacts'
                    },
                    {
                        label: 'Create Contact',
                        name: 'create_contact'
                    },
                    {
                        label: 'Get Contact',
                        name: 'get_contact'
                    },
                    {
                        label: 'Update Contact',
                        name: 'update_contact'
                    },
                    {
                        label: 'List Deals',
                        name: 'list_deals'
                    },
                    {
                        label: 'Create Deal',
                        name: 'create_deal'
                    }
                ]
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const privateAppToken = getCredentialParam('privateAppToken', credentialData, nodeData)

        if (!privateAppToken) {
            throw new Error('No HubSpot Private App Access Token provided')
        }

        const actions: string[] = convertMultiOptionsToStringArray(nodeData.inputs?.actions)

        const tools = createHubspotTools({
            actions,
            privateAppToken
        })

        return tools
    }
}

module.exports = { nodeClass: Hubspot_Tools }
