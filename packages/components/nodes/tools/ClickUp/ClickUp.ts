import { convertMultiOptionsToStringArray, getCredentialData, getCredentialParam } from '../../../src/utils'
import { createClickUpTools } from './core'
import type { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class ClickUp_Tools implements INode {
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
        this.label = 'ClickUp'
        this.name = 'clickupTool'
        this.version = 1.0
        this.type = 'ClickUp'
        this.icon = 'clickup.svg'
        this.category = 'Tools'
        this.description = 'Manage ClickUp tasks and lists'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['clickupApi']
        }
        this.inputs = [
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'List Tasks',
                        name: 'list_tasks'
                    },
                    {
                        label: 'Create Task',
                        name: 'create_task'
                    },
                    {
                        label: 'Get Task',
                        name: 'get_task'
                    },
                    {
                        label: 'Update Task',
                        name: 'update_task'
                    },
                    {
                        label: 'List Spaces',
                        name: 'list_spaces'
                    }
                ]
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const apiToken = getCredentialParam('apiToken', credentialData, nodeData)

        if (!apiToken) {
            throw new Error('No ClickUp API Token provided')
        }

        const actions = convertMultiOptionsToStringArray(nodeData.inputs?.actions)

        const tools = createClickUpTools({
            actions,
            apiToken
        })

        return tools
    }
}

module.exports = { nodeClass: ClickUp_Tools }
