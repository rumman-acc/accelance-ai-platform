import { convertMultiOptionsToStringArray, getCredentialData, getCredentialParam } from '../../../src/utils'
import { createXeroTools } from './core'
import type { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class Xero_Tools implements INode {
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
        this.label = 'Xero'
        this.name = 'xeroTool'
        this.version = 1.0
        this.type = 'Xero'
        this.icon = 'xero.svg'
        this.category = 'Tools'
        this.description = 'Manage Xero invoices, contacts, and accounts'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['xeroApi']
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
                        label: 'List Invoices',
                        name: 'list_invoices'
                    },
                    {
                        label: 'Create Invoice',
                        name: 'create_invoice'
                    },
                    {
                        label: 'List Accounts',
                        name: 'list_accounts'
                    }
                ]
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        let credentialData = await getCredentialData(nodeData.credential ?? '', options)

        const tenantId = getCredentialParam('tenantId', credentialData, nodeData)
        const accessToken = getCredentialParam('accessToken', credentialData, nodeData)

        if (!tenantId || !accessToken) {
            throw new Error('Invalid credentials: provide both Tenant ID and Access Token')
        }

        const actions = convertMultiOptionsToStringArray(nodeData.inputs?.actions)

        const tools = createXeroTools({
            actions,
            tenantId,
            accessToken
        })

        return tools
    }
}

module.exports = { nodeClass: Xero_Tools }
