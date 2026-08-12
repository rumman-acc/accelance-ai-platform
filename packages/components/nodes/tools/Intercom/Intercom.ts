import { convertMultiOptionsToStringArray, getCredentialData, getCredentialParam } from '../../../src/utils'
import { createIntercomTools } from './core'
import type { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class Intercom_Tools implements INode {
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
        this.label = 'Intercom'
        this.name = 'intercomTool'
        this.version = 1.0
        this.type = 'Intercom'
        this.icon = 'intercom.svg'
        this.category = 'Tools'
        this.description = 'Manage Intercom contacts and conversations'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['intercomApi']
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
                        label: 'Create Conversation',
                        name: 'create_conversation'
                    },
                    {
                        label: 'List Conversations',
                        name: 'list_conversations'
                    }
                ]
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const accessToken = getCredentialParam('accessToken', credentialData, nodeData)

        if (!accessToken) {
            throw new Error('No Intercom access token provided')
        }

        const actions = convertMultiOptionsToStringArray(nodeData.inputs?.actions)

        const tools = createIntercomTools({
            actions,
            accessToken
        })

        return tools
    }
}

module.exports = { nodeClass: Intercom_Tools }
