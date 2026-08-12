import { convertMultiOptionsToStringArray, getCredentialData, getCredentialParam } from '../../../src/utils'
import { createSendGridTools } from './core'
import type { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class SendGrid_Tools implements INode {
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
        this.label = 'SendGrid'
        this.name = 'sendgridTool'
        this.version = 1.0
        this.type = 'SendGrid'
        this.icon = 'sendgrid.svg'
        this.category = 'Tools'
        this.description = 'Send email and manage marketing contacts via SendGrid'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['sendgridApi']
        }
        this.inputs = [
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'Send Email',
                        name: 'send_email'
                    },
                    {
                        label: 'List Contacts',
                        name: 'list_contacts'
                    },
                    {
                        label: 'Add Contact',
                        name: 'add_contact'
                    },
                    {
                        label: 'List Templates',
                        name: 'list_templates'
                    },
                    {
                        label: 'Get Stats',
                        name: 'get_stats'
                    }
                ]
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const apiKey = getCredentialParam('apiKey', credentialData, nodeData)

        if (!apiKey) {
            throw new Error('No SendGrid API Key provided')
        }

        const actions = convertMultiOptionsToStringArray(nodeData.inputs?.actions)

        const tools = createSendGridTools({
            actions,
            apiKey
        })

        return tools
    }
}

module.exports = { nodeClass: SendGrid_Tools }
