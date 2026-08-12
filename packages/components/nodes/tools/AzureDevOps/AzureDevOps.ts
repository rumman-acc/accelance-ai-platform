import { convertMultiOptionsToStringArray, getCredentialData, getCredentialParam } from '../../../src/utils'
import { createAzureDevOpsTools } from './core'
import type { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class AzureDevOps_Tools implements INode {
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
        this.label = 'Azure DevOps'
        this.name = 'azureDevOpsTool'
        this.version = 1.0
        this.type = 'AzureDevOps'
        this.icon = 'azuredevops.svg'
        this.category = 'Tools'
        this.description = 'Manage Azure DevOps projects, work items, and repositories'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['azureDevOpsApi']
        }
        this.inputs = [
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
                        label: 'Query Work Items',
                        name: 'query_work_items'
                    },
                    {
                        label: 'Create Work Item',
                        name: 'create_work_item'
                    },
                    {
                        label: 'Get Work Item',
                        name: 'get_work_item'
                    },
                    {
                        label: 'List Repositories',
                        name: 'list_repositories'
                    }
                ]
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const organization = getCredentialParam('organization', credentialData, nodeData)
        const personalAccessToken = getCredentialParam('personalAccessToken', credentialData, nodeData)

        if (!organization) {
            throw new Error('No Azure DevOps organization provided')
        }

        if (!personalAccessToken) {
            throw new Error('No Azure DevOps Personal Access Token provided')
        }

        const actions = convertMultiOptionsToStringArray(nodeData.inputs?.actions)

        const tools = createAzureDevOpsTools({
            actions,
            organization,
            personalAccessToken
        })

        return tools
    }
}

module.exports = { nodeClass: AzureDevOps_Tools }
