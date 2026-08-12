import { convertMultiOptionsToStringArray, getCredentialData, getCredentialParam } from '../../../src/utils'
import { createConfluenceTools } from './core'
import type { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class Confluence_Tools implements INode {
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
        this.label = 'Confluence'
        this.name = 'confluenceTool'
        this.version = 1.0
        this.type = 'Confluence'
        this.icon = 'confluence.svg'
        this.category = 'Tools'
        this.description = 'Manage Confluence spaces and pages'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['confluenceCloudApi']
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
                        label: 'List Spaces',
                        name: 'list_spaces'
                    },
                    {
                        label: 'Get Page',
                        name: 'get_page'
                    },
                    {
                        label: 'Create Page',
                        name: 'create_page'
                    },
                    {
                        label: 'Update Page',
                        name: 'update_page'
                    },
                    {
                        label: 'Search Content',
                        name: 'search_content'
                    }
                ]
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const siteUrl = nodeData.inputs?.siteUrl as string

        if (!siteUrl) {
            throw new Error('No Confluence site URL provided')
        }

        const username = getCredentialParam('username', credentialData, nodeData)
        const accessToken = getCredentialParam('accessToken', credentialData, nodeData)

        if (!username || !accessToken) {
            throw new Error('Invalid credentials: provide both Username and Access Token')
        }

        const actions = convertMultiOptionsToStringArray(nodeData.inputs?.actions)

        const tools = createConfluenceTools({
            actions,
            siteUrl,
            username,
            accessToken
        })

        return tools
    }
}

module.exports = { nodeClass: Confluence_Tools }
