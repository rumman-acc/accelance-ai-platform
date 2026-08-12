import { convertMultiOptionsToStringArray, getCredentialData, getCredentialParam } from '../../../src/utils'
import { createEntraIdTools } from './core'
import type { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class EntraId_Tools implements INode {
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
        this.label = 'Microsoft Entra ID'
        this.name = 'entraIdTool'
        this.version = 1.0
        this.type = 'EntraId'
        this.icon = 'entraid.svg'
        this.category = 'Tools'
        this.description = 'Manage Entra ID (Azure AD) users and groups'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['entraIdApi']
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
                        label: 'Add User To Group',
                        name: 'add_user_to_group'
                    }
                ]
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)

        const tenantId = getCredentialParam('tenantId', credentialData, nodeData)
        const clientId = getCredentialParam('clientId', credentialData, nodeData)
        const clientSecret = getCredentialParam('clientSecret', credentialData, nodeData)

        if (!tenantId || !clientId || !clientSecret) {
            throw new Error('Invalid credentials: Tenant ID, Client ID, and Client Secret are all required')
        }

        const actions = convertMultiOptionsToStringArray(nodeData.inputs?.actions)

        const tools = createEntraIdTools({
            actions,
            tenantId,
            clientId,
            clientSecret
        })

        return tools
    }
}

module.exports = { nodeClass: EntraId_Tools }
