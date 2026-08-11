import { convertMultiOptionsToStringArray, getCredentialData, getCredentialParam } from '../../../src/utils'
import { createSalesforceTools } from './core'
import type { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class Salesforce_Tools implements INode {
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
        this.label = 'Salesforce'
        this.name = 'salesforceTool'
        this.version = 1.0
        this.type = 'Salesforce'
        this.icon = 'salesforce.svg'
        this.category = 'Tools'
        this.description = 'Query and manage Salesforce records (Leads, Contacts, Accounts, Opportunities, or any custom object)'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['salesforceApi']
        }
        this.inputs = [
            {
                label: 'API Version',
                name: 'apiVersion',
                type: 'string',
                default: 'v62.0',
                description:
                    'Salesforce REST API version to call, e.g. v62.0. Salesforce deprecates old versions roughly once a year, so this may need bumping periodically.'
            },
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'Query Records',
                        name: 'query_records'
                    },
                    {
                        label: 'Create Record',
                        name: 'create_record'
                    },
                    {
                        label: 'Get Record',
                        name: 'get_record'
                    },
                    {
                        label: 'Update Record',
                        name: 'update_record'
                    },
                    {
                        label: 'Delete Record',
                        name: 'delete_record'
                    }
                ]
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        let credentialData = await getCredentialData(nodeData.credential ?? '', options)

        const instanceUrl = getCredentialParam('instanceUrl', credentialData, nodeData)
        const accessToken = getCredentialParam('accessToken', credentialData, nodeData)

        if (!instanceUrl || !accessToken) {
            throw new Error('Invalid credentials: provide both Instance URL and Access Token')
        }

        const apiVersion = (nodeData.inputs?.apiVersion as string) || 'v62.0'
        const actions = convertMultiOptionsToStringArray(nodeData.inputs?.actions)

        const tools = createSalesforceTools({
            actions,
            instanceUrl,
            accessToken,
            apiVersion
        })

        return tools
    }
}

module.exports = { nodeClass: Salesforce_Tools }
