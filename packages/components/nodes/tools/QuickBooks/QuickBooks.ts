import { convertMultiOptionsToStringArray, getCredentialData, getCredentialParam } from '../../../src/utils'
import { createQuickBooksTools } from './core'
import type { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class QuickBooks_Tools implements INode {
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
        this.label = 'QuickBooks'
        this.name = 'quickbooksTool'
        this.version = 1.0
        this.type = 'QuickBooks'
        this.icon = 'quickbooks.svg'
        this.category = 'Tools'
        this.description = 'Manage QuickBooks Online invoices, customers, and accounts'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['quickbooksApi']
        }
        this.inputs = [
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'Query',
                        name: 'query'
                    },
                    {
                        label: 'Create Customer',
                        name: 'create_customer'
                    },
                    {
                        label: 'Get Customer',
                        name: 'get_customer'
                    },
                    {
                        label: 'Create Invoice',
                        name: 'create_invoice'
                    },
                    {
                        label: 'Get Invoice',
                        name: 'get_invoice'
                    }
                ]
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        let credentialData = await getCredentialData(nodeData.credential ?? '', options)

        const realmId = getCredentialParam('realmId', credentialData, nodeData)
        const accessToken = getCredentialParam('accessToken', credentialData, nodeData)

        if (!realmId || !accessToken) {
            throw new Error('Invalid credentials: provide both Realm ID and Access Token')
        }

        const actions = convertMultiOptionsToStringArray(nodeData.inputs?.actions)

        const tools = createQuickBooksTools({
            actions,
            realmId,
            accessToken
        })

        return tools
    }
}

module.exports = { nodeClass: QuickBooks_Tools }
