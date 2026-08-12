import { convertMultiOptionsToStringArray, getCredentialData, getCredentialParam } from '../../../src/utils'
import { createBitbucketTools } from './core'
import type { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class Bitbucket_Tools implements INode {
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
        this.label = 'Bitbucket'
        this.name = 'bitbucketTool'
        this.version = 1.0
        this.type = 'Bitbucket'
        this.icon = 'bitbucket.svg'
        this.category = 'Tools'
        this.description = 'Manage Bitbucket repositories, pull requests, and issues'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['bitbucketApi']
        }
        this.inputs = [
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'List Repositories',
                        name: 'list_repositories'
                    },
                    {
                        label: 'Get Repository',
                        name: 'get_repository'
                    },
                    {
                        label: 'List Pull Requests',
                        name: 'list_pull_requests'
                    },
                    {
                        label: 'Create Pull Request',
                        name: 'create_pull_request'
                    },
                    {
                        label: 'List Issues',
                        name: 'list_issues'
                    }
                ]
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        let credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const username = getCredentialParam('username', credentialData, nodeData)
        const appPassword = getCredentialParam('appPassword', credentialData, nodeData)

        if (!username || !appPassword) {
            throw new Error('Invalid credentials: provide both Username and App Password')
        }

        const actions = convertMultiOptionsToStringArray(nodeData.inputs?.actions)

        const authConfig = {
            username,
            appPassword
        }

        const tools = createBitbucketTools({
            actions,
            username,
            appPassword,
            authConfig
        })

        return tools
    }
}

module.exports = { nodeClass: Bitbucket_Tools }
