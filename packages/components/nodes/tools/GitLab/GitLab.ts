import { convertMultiOptionsToStringArray, getCredentialData, getCredentialParam } from '../../../src/utils'
import { createGitLabTools } from './core'
import type { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class GitLab_Tools implements INode {
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
        this.label = 'GitLab'
        this.name = 'gitlabTool'
        this.version = 1.0
        this.type = 'GitLab'
        this.icon = 'gitlab.svg'
        this.category = 'Tools'
        this.description = 'Manage GitLab projects, issues, and merge requests'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['gitlabApi']
        }
        this.inputs = [
            {
                label: 'Instance URL',
                name: 'instanceUrl',
                type: 'string',
                default: 'https://gitlab.com',
                description: 'change for a self-hosted GitLab instance'
            },
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'List Projects',
                        name: 'list_projects'
                    },
                    {
                        label: 'Create Issue',
                        name: 'create_issue'
                    },
                    {
                        label: 'List Issues',
                        name: 'list_issues'
                    },
                    {
                        label: 'Get Merge Request',
                        name: 'get_merge_request'
                    },
                    {
                        label: 'Create Merge Request',
                        name: 'create_merge_request'
                    }
                ]
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)

        const personalAccessToken = getCredentialParam('personalAccessToken', credentialData, nodeData)

        if (!personalAccessToken) {
            throw new Error('Invalid credentials: provide a Personal Access Token')
        }

        const instanceUrl = (nodeData.inputs?.instanceUrl as string) || 'https://gitlab.com'
        const actions = convertMultiOptionsToStringArray(nodeData.inputs?.actions)

        const authConfig = {
            personalAccessToken
        }

        const tools = createGitLabTools({
            actions,
            instanceUrl,
            personalAccessToken,
            authConfig
        })

        return tools
    }
}

module.exports = { nodeClass: GitLab_Tools }
