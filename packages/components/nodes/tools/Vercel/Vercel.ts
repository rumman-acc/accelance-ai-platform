import { convertMultiOptionsToStringArray, getCredentialData, getCredentialParam } from '../../../src/utils'
import { createVercelTools } from './core'
import type { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class Vercel_Tools implements INode {
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
        this.label = 'Vercel'
        this.name = 'vercelTool'
        this.version = 1.0
        this.type = 'Vercel'
        this.icon = 'vercel.svg'
        this.category = 'Tools'
        this.description = 'Manage Vercel deployments and projects'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['vercelApi']
        }
        this.inputs = [
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'List Deployments',
                        name: 'list_deployments'
                    },
                    {
                        label: 'Get Deployment',
                        name: 'get_deployment'
                    },
                    {
                        label: 'List Projects',
                        name: 'list_projects'
                    },
                    {
                        label: 'Create Deployment',
                        name: 'create_deployment'
                    },
                    {
                        label: 'Delete Deployment',
                        name: 'delete_deployment'
                    }
                ]
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const apiToken = getCredentialParam('apiToken', credentialData, nodeData)
        const teamId = getCredentialParam('teamId', credentialData, nodeData)

        if (!apiToken) {
            throw new Error('No Vercel API token provided')
        }

        const actions = convertMultiOptionsToStringArray(nodeData.inputs?.actions)

        const tools = createVercelTools({
            actions,
            apiToken,
            teamId
        })

        return tools
    }
}

module.exports = { nodeClass: Vercel_Tools }
