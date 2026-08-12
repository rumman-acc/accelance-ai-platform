import { convertMultiOptionsToStringArray, getCredentialData, getCredentialParam } from '../../../src/utils'
import { createOktaTools } from './core'
import type { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class Okta_Tools implements INode {
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
        this.label = 'Okta'
        this.name = 'oktaTool'
        this.version = 1.0
        this.type = 'Okta'
        this.icon = 'okta.svg'
        this.category = 'Tools'
        this.description = 'Manage Okta users and groups'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['oktaApi']
        }
        this.inputs = [
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'List Users',
                        name: 'list_users'
                    },
                    {
                        label: 'Get User',
                        name: 'get_user'
                    },
                    {
                        label: 'Create User',
                        name: 'create_user'
                    },
                    {
                        label: 'List Groups',
                        name: 'list_groups'
                    },
                    {
                        label: 'Add User to Group',
                        name: 'add_user_to_group'
                    }
                ]
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const oktaDomain = getCredentialParam('oktaDomain', credentialData, nodeData)
        const apiToken = getCredentialParam('apiToken', credentialData, nodeData)

        if (!oktaDomain) {
            throw new Error('No Okta domain provided')
        }

        if (!apiToken) {
            throw new Error('No Okta API token provided')
        }

        const actions = convertMultiOptionsToStringArray(nodeData.inputs?.actions as string)

        const tools = createOktaTools({
            actions,
            oktaDomain,
            apiToken
        })

        return tools
    }
}

module.exports = { nodeClass: Okta_Tools }
