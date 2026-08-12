import { convertMultiOptionsToStringArray, getCredentialData, getCredentialParam } from '../../../src/utils'
import { createMailchimpTools } from './core'
import type { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class Mailchimp_Tools implements INode {
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
        this.label = 'Mailchimp'
        this.name = 'mailchimpTool'
        this.version = 1.0
        this.type = 'Mailchimp'
        this.icon = 'mailchimp.svg'
        this.category = 'Tools'
        this.description = 'Manage Mailchimp audiences and campaigns'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['mailchimpApi']
        }
        this.inputs = [
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'List Audiences',
                        name: 'list_audiences'
                    },
                    {
                        label: 'Add List Member',
                        name: 'add_list_member'
                    },
                    {
                        label: 'Get List Member',
                        name: 'get_list_member'
                    },
                    {
                        label: 'List Campaigns',
                        name: 'list_campaigns'
                    },
                    {
                        label: 'Create Campaign',
                        name: 'create_campaign'
                    }
                ]
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const apiKey = getCredentialParam('apiKey', credentialData, nodeData)

        if (!apiKey) {
            throw new Error('No Mailchimp API Key provided')
        }

        const actions = convertMultiOptionsToStringArray(nodeData.inputs?.actions)

        const defaultParams: Record<string, any> = {}

        const authConfig = {
            apiKey
        }

        const tools = createMailchimpTools({
            actions,
            apiKey,
            defaultParams,
            authConfig
        })

        return tools
    }
}

module.exports = { nodeClass: Mailchimp_Tools }
