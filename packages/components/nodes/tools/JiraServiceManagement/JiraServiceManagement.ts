import { convertMultiOptionsToStringArray, getCredentialData, getCredentialParam } from '../../../src/utils'
import { createJiraServiceManagementTools } from './core'
import type { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class JiraServiceManagement_Tools implements INode {
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
        this.label = 'Jira Service Management'
        this.name = 'jiraServiceManagementTool'
        this.version = 1.0
        this.type = 'JiraServiceManagement'
        this.icon = 'jirasm.svg'
        this.category = 'Tools'
        this.description = 'Manage Jira Service Management customer requests and service desks'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['jiraApi']
        }
        this.inputs = [
            {
                label: 'Site URL',
                name: 'siteUrl',
                type: 'string',
                placeholder: 'https://yourcompany.atlassian.net'
            },
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'List Service Desks',
                        name: 'list_service_desks'
                    },
                    {
                        label: 'Create Customer Request',
                        name: 'create_customer_request'
                    },
                    {
                        label: 'Get Request',
                        name: 'get_request'
                    },
                    {
                        label: 'List Requests',
                        name: 'list_requests'
                    },
                    {
                        label: 'Add Comment',
                        name: 'add_comment'
                    }
                ]
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const siteUrl = nodeData.inputs?.siteUrl as string

        if (!siteUrl) {
            throw new Error('No Jira Service Management site URL provided')
        }

        const username = getCredentialParam('username', credentialData, nodeData)
        const accessToken = getCredentialParam('accessToken', credentialData, nodeData)

        if (!username || !accessToken) {
            throw new Error('Invalid credentials: provide Username and Access Token')
        }

        const actions = convertMultiOptionsToStringArray(nodeData.inputs?.actions)

        const tools = createJiraServiceManagementTools({
            actions,
            siteUrl,
            username,
            accessToken
        })

        return tools
    }
}

module.exports = { nodeClass: JiraServiceManagement_Tools }
