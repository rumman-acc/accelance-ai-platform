import { convertMultiOptionsToStringArray, getCredentialData, getCredentialParam } from '../../../src/utils'
import { createCircleCITools } from './core'
import type { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class CircleCI_Tools implements INode {
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
        this.label = 'CircleCI'
        this.name = 'circleciTool'
        this.version = 1.0
        this.type = 'CircleCI'
        this.icon = 'circleci.svg'
        this.category = 'Tools'
        this.description = 'Trigger and inspect CircleCI pipelines'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['circleciApi']
        }
        this.inputs = [
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'List Pipelines',
                        name: 'list_pipelines'
                    },
                    {
                        label: 'Trigger Pipeline',
                        name: 'trigger_pipeline'
                    },
                    {
                        label: 'Get Pipeline',
                        name: 'get_pipeline'
                    },
                    {
                        label: 'List Workflows',
                        name: 'list_workflows'
                    },
                    {
                        label: 'Get Workflow',
                        name: 'get_workflow'
                    }
                ]
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const apiToken = getCredentialParam('apiToken', credentialData, nodeData)

        if (!apiToken) {
            throw new Error('No CircleCI API Token provided')
        }

        const actions = convertMultiOptionsToStringArray(nodeData.inputs?.actions)

        const tools = createCircleCITools({
            actions,
            apiToken
        })

        return tools
    }
}

module.exports = { nodeClass: CircleCI_Tools }
